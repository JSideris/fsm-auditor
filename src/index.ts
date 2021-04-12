
export default class StateMachine{
	private states: {[state: string]: {[state: string]: {}}} = {};
	private current: {[state: string]: {}} | null = null;
	private currentName: string = "start";
	logChanges: boolean = false;
    logErrors: boolean = true;
    throwErrors: boolean = false;
    name: string;

	constructor(name: string){
        this.name = name;
		this.states = {};
		this.getCreateState("start");
		this.getCreateState("finish");
		
		this.set("start");
	}

	private err(errMsg: string){
        if(this.logErrors) console.error(errMsg);
		if(this.throwErrors) throw new Error(errMsg);
	}

	private getCreateState(stateName: string){
		if(!stateName) this.err(`Invalid state name '${stateName}'.`);
		if(!this.states[stateName]) this.states[stateName] = {};
		return this.states[stateName];
	}

	protected connect(sourceState: string, destinationState: string){
		//if(!this.states[sourceState]) this.err(`State error: Source state '${sourceState}' not found.`);
		//if(!this.states[destinationState]) this.err(`State error: Destination state '${destinationState}' not found.`);

		let src = this.getCreateState(sourceState);
		let dest = this.getCreateState(destinationState);

		if(src[destinationState]) this.err(`Duplicate connection '${sourceState}' -> '${destinationState}'.`);
		src[destinationState] = dest;
	}

	protected start(destinationState: string){
		return this.connect("start", destinationState);
	}

	protected finish(sourceState: string){
		return this.connect(sourceState, "finish");
	}

	private set(stateName: string){
		this.current = this.states[stateName];
		if(!this.current) this.err(`State error: State '${stateName}' not found.`);
		this.currentName = stateName;
	}

	move(stateName: string){

		if(this.logChanges){
			console.log(`%c${this.currentName.toUpperCase()} %c→%c ${stateName.toUpperCase()}`, 
				"font-size: 20px; color: black;",
				"font-size: 20px; color: gray;",
				"font-size: 20px; color: black;"
			);
		}

		if(!this.states[stateName]) return this.err(`State error: State '${stateName}' not found.`);
		if(!this.current) return this.err(`State error: Current state not valid.`);
		
		if(!this.current[stateName]) this.err(`State error: Cannot move from ${this.currentName} to ${stateName}.`);
		this.current = this.current[stateName];
		this.currentName = stateName
	}

	get currentState(){
		return this.currentName;
	}

	protected validate(){
		// Forward - ensure everyone has a path forward from the start.

		let visited: {[name: string]: number} = {};
		let toVisit = ["start"];

		while(toVisit.length > 0)
		{
			let current: string|undefined = toVisit.shift() as string;

			visited[current] = 1;

			let pointsTo = this.states[current];
			let keys = Object.keys(pointsTo);

			if(keys.length == 0 && current != "finish") this.err(`Illegal terminal state '${current}'. Final state must be 'finish'.`);

			keys.forEach(k => {
				if(k == "start") this.err(`Illegal return to 'start' from '${current}'.`);
				if(!visited[k]) toVisit.push(k);
			});
		}

		Object.keys(this.states).forEach(k => {
			if(!visited[k]) this.err(`State '${k}' is not accessible.`);
		});

		// Backwards - ensure everyone has a path to the exit.

		visited = {};
		toVisit = ["finish"];

		while(toVisit.length > 0)
		{
			let current: string = toVisit.shift() as string;

			visited[current] = 1;

			let allStateKeys = Object.keys(this.states);

			allStateKeys.forEach(k => {
				if(!visited[k] && this.states[k][current]) toVisit.push(k);
			});
		}

		Object.keys(this.states).forEach(k => {
			if(!visited[k]) this.err(`State '${k}' cannot reach finish.`);
		});
	}
}