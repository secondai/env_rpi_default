

// Load in actions 
import { 
	requestData
} from './actions'

import runSafe from '../utils/run_safe'
import buildCode from '../utils/build_code'

import ipc from './ipc'

import _ from 'lodash'

const lodash = _;

const BASIC_NODES = {
	default: require('./basics/default.json'),
	teacher: require('./basics/teacher.json'),
}

const {
  performance
} = require('perf_hooks');



// AI handles an input 
// - input includes authentication 
// - could be a JWT, or some other kind of asset 
// - function: handle_initiate_request: converts incoming request to AuthInputUser (input is the request, and all the Subjects with a Datasource PointerType) 

// "You said something, so the AI is going to handle the response and have an Output in some fashion" 
// - may also trigger lots of side effects, but there should always be a response (or at least one is requested and expected!) 

// the incoming request is for your AI to DO something (fetch data, take an action, etc.) and RETURN something. 
// - do ACTION with INPUT (query of code for fetching, or subject/pointers?) and return OUTPUT (subjects and pointers, following a schema). 
// - fetch each piece of DATA (subject/pointers) matching parameters/code. your AI determines what the data looks like when I access it 
//   - accessing is the same as 
//   - could also have a "this is the data you want to take?" vs "this is how you want to query the data and transform it" 
//   - effectively they want to run a Test against the data, and return data that passes the test 


// AI gets a REQUEST from an APP that has a JWT saying "I am X user"
// REQUEST is to gather data from X,Y datasources (using Z query (same query for all datasources??) )
// - "I want you to gather this information from these datasources" 
// - Action: query_datasources_v1:schemaLocation:txIdForSchema, ActionSchema got from 3rd party, for validating input format (i.e query+datasourceIds)
//   - function: allow_incoming_request_action (action can be allowed/denied based on the AuthInputUser, Action, and ActionData [schema defined on blockchain]) -> returns Boolean on allowed or not
// - authorized User: Subject/Pointer combo

// after fetching data, make sure the fetched data passes the Tests we defined for what we WANTED (the friend's AI could have returned some shitty data, which we dont want to just pass-thru) 

// action: query these datasources and return the data for this query 
// - an action this AI can do is "query_datasources" 

// can run a "validate" function for each piece of data that shows problems with data (2 of some PointerType when only 1 is allowed)

let requestsCache = {};

const uuidv4 = require('uuid/v4');
const events = require('events');
let eventEmitter = new events.EventEmitter();
app.eventEmitter = eventEmitter;

// Keep nodes in memory for easy access!
// - rebuilds on changes, etc. 
app.nodesDb = [];


// for creating a group of VMs that are processing things in parallel 
// - the group name is passed in, as well as the amount to allow at a time 
var queue = require('queue')
let parallelVMs = {};

const mainIpcId = ipc.__customId; // this is a uuid set in ./ipc.js 

// Handle ipc server incoming commands
// ipc.server.on('command',async (message, socket) => {
eventEmitter.on('command',async (message, socket) => {
  // console.log(message);

  // message include the data and the tenant! 

  // message = JSON.parse(message); 

  console.log('incoming ipc command!', typeof message, message.command);

  // await app.graphql.newHistory({
  // 	type: 'incoming_ipc_command:' + message.command, // should be a Node type (for easier display)  
  // 	logLevel: 'info',
  // 	data: {
  // 		message: message
  // 	}
  // })

  switch(message.command){
  	
  	case 'fetchNodes':

  		// message.data = "filter"
			// let nodes = await app.graphql.fetchNodes(message.filter);


    	let timeStart1 = (new Date());

			console.log('Fetched Nodes Possible:', app.nodesDb.length); //, nodes.length);
			let nodesDb = JSON.parse(JSON.stringify(app.nodesDb));

			let timeStart2 = (new Date());

		  const fetchNodesQuick = (filterObj, depth) => {
		    // also fetches all child nodes, for 10 levels deep
		    return new Promise(async (resolve,reject)=>{
		      depth = depth || 1;
		      depth++;
		      if(depth > 5){
		        // too deep! (or pointing in a loop!) 
		        return resolve([]);
		      }

		      let nodes = JSON.parse(JSON.stringify(lodash.filter(nodesDb, filterObj))); // mimics simply object requests 

		      // console.log('Found nodes!');

		      for(let node of nodes){

		        // get parent
		        if(node.nodeId){
		          // find parent 
		          // let parent = await fetchNodesQuick({_id: node.nodeId}, 4);
		          // if(parent && parent.length){
		          //   node.parent = parent[0];
		          // }
		          node.parent = lodash.find(nodesDb, {_id: node.nodeId});

		        }

		        // get children 
		        node.nodes = await fetchNodesQuick({nodeId: node._id}, depth);

		      }

		      // console.log('After nodes');

		      resolve(nodes);

		    });
		  }

		  let nodes = await fetchNodesQuick(message.filter, 1);

			console.log('Fetched Nodes Quick2', nodes.length); //, message.filter); //, nodes.length);

    	let timeEnd1 = (new Date());
		  console.log('FetchNodes Time1:', (timeEnd1.getTime() - timeStart1.getTime())/1000, (timeStart2.getTime() - timeStart1.getTime())/1000); 

		  eventEmitter.emit(
		    'response',
		    {
		      // id      : ipc.config.id,
		      id: message.id,
		      data: nodes //JSON.parse(JSON.stringify(nodes))
		    }
		  );

  		break;
  	
  	case 'historyLog':

			// skipping history for now
		  eventEmitter.emit(
		    'response',
		    {
		      // id      : ipc.config.id,
		      id: message.id,
		      data: {}
		    }
		  );

  	// 	// message.data = "filter"
			// let savedHistory = await app.graphql.newHistory({
			// 	type: message.type,
			// 	logLevel: message.logLevel,
			// 	data: message.data,
			// });

		 //  eventEmitter.emit(
		 //    'response',
		 //    {
		 //      // id      : ipc.config.id,
		 //      id: message.id,
		 //      data: savedHistory
		 //    }
		 //  );

  		break;

  	case 'newNode':

  		// message.data = "filter"
			let savedNode = await app.graphql.newNode(message.node);

			// Update memory!
	    app.nodesDb = await app.graphql.fetchNodesSimple();

		  eventEmitter.emit(
		    'response',
		    {
		      // id      : ipc.config.id,
		      id: message.id,
		      data: savedNode
		    }
		  );

  		break;

  	case 'findNode':

  		// message.data = "filter"
			let node = await app.graphql.findNode(message.filter);


		  eventEmitter.emit(
		    'response',
		    {
		      // id      : ipc.config.id,
		      id: message.id,
		      data: node
		    }
		  );

  		break;

  	case 'updateNode':

  		// console.log('UpdateNode:', typeof message.node)
  		// console.log('UpdateNode2:', JSON.stringify(message.node, null,2))
  		console.log('UpdateNode');

  		// message.data = "filter"
			let updatedNode = await app.graphql.updateNode(message.node);

			// Update memory!
	    app.nodesDb = await app.graphql.fetchNodesSimple();

		  eventEmitter.emit(
		    'response',
		    {
		      // id      : ipc.config.id,
		      id: message.id,
		      data: updatedNode
		    }
		  );

  		break;


  	case 'ThreadedSafeRun':

  		message.workGroup = message.workGroup || uuidv4();
  		message.workers = message.workers || 100;

  		let code = message.code;
  		let nodeId = message.nodeId;
  		let timeout = message.timeout;
  		let safeContext = {
  			SELF: message.SELF, // code node
  			INPUT: message.INPUT
  		}
  		let requires = ['lodash'];
  		let threadEventHandlers = {};
  		let requestId = message.requestId;
  		let mainIpcId = message.mainIpcId;

  		let thisCQ = parallelVMs[message.workGroup];
  		if(!thisCQ){

	  		thisCQ = queue({
	  			concurrency: message.workers, 
	  			autostart: true
	  		});

				// get notified when jobs complete
				thisCQ.on('success', (result, job) => {
				  // nothing to do, handled in-job 
				  // console.log('Job done');
				})
				thisCQ.on('end', (err) => {
				  // all jobs finished 
				  delete parallelVMs[message.workGroup];
				  // console.log('All jobs finished!');
				})

				parallelVMs[message.workGroup] = thisCQ;

  		}

  		thisCQ.push(()=>{
  			// { socket, message, code, safeContext, requires, threadEventHandlers, requestId, nodeId, timeout}

		    return new Promise(async (resolve, reject)=>{

		    	// let { socket, message, code, safeContext, requires, threadEventHandlers, requestId, nodeId, timeout} = task;

		    	// let startDate = (new Date());
		    	// console.log('TaskNodeId:', typeof message.workers, message.workers, nodeId, startDate.getSeconds()+'.'+startDate.getMilliseconds());
					let safedData;
		      try {
		      	let timeStart = (new Date());
		        safedData = await runSafe({ code, safeContext, requires, threadEventHandlers, requestId, mainIpcId, nodeId, timeout})
		      	let timeEnd = (new Date());
		        // console.log('runSafe time:', timeEnd.getTime() - timeStart.getTime()); //, 'group:'+message.workGroup, 'id:'+message.SELF._id, timeStart.getSeconds() + '.' + timeStart.getMilliseconds(), timeEnd.getSeconds() + '.' + timeEnd.getMilliseconds()); // message.datetime
		      }catch(err){
		      	console.error('Failed safedData from sandbox1');
		      	eventEmitter.emit(
					    'response',
					    {
					      // id      : ipc.config.id,
					      id: message.id,
					      data: 'Failed safedData'
					    }
					  );
					  // console.log('FINISH IPC1');
					  return resolve(); // allow workers to continue
		      }

				  eventEmitter.emit(
				    'response',
				    {
				      // id      : ipc.config.id,
				      id: message.id,
				      data: safedData
				    }
				  );
					// console.log('FINISH IPC2');
				  return resolve(); // allow workers to continue

		    })
  		});

  		// console.log('Add to cq');
  		// thisCQ.drained(()=>{
  		// 	// delete parallelVMs[message.workGroup]; // kill concurrency queue! 
  		// })

  		break;

  	case 'getRequestCache':
  		// process should have the requestId in it?
  		// - or somehow it could look up the chain if necessary? 
  		// - or each process coulc kinda self-identify that it was creaing a new process, and then this could crawl that chain? 


		  eventEmitter.emit(
		    'response',
		    {
		      // id      : ipc.config.id,
		      id: message.id,
		      data: requestsCache[message.requestId]
		    }
		  );

  		break;

  	case 'setRequestCacheKeyValue':
  		// process should have the requestId in it?
  		// - or somehow it could look up the chain if necessary? 
  		// - or each process coulc kinda self-identify that it was creaing a new process, and then this could crawl that chain? 

  		var cache = requestsCache[message.requestId];
  		cache.keyvalue[message.key] = message.value;

		  eventEmitter.emit(
		    'response',
		    {
		      // id      : ipc.config.id,
		      id: message.id,
		      data: cache
		    }
		  );

  		break;

  	case 'pushToRequestCacheStack':
  		// process should have the requestId in it?
  		// - or somehow it could look up the chain if necessary? 
  		// - or each process coulc kinda self-identify that it was creaing a new process, and then this could crawl that chain? 

  		var cache = requestsCache[message.requestId];
  		cache.stack.push(message.value);

		  eventEmitter.emit(
		    'response',
		    {
		      // id      : ipc.config.id,
		      id: message.id,
		      data: cache
		    }
		  );

  		break;

  	default:
  		break;
  }


})


// Create Second 
// - handle inputs 

let secondReadyResolve;
const secondReady = new Promise(resolve=>{
  secondReadyResolve = resolve;
  // resolve(); // todo: build if not ready! 
});

class Second {
	constructor(){

		console.log('Second constructor!');

		this.startup = this.startup.bind(this);
		this.runRequest = this.runRequest.bind(this);

		this.startup();

	}
	async startup(){

		// Get existing Nodes in memory 
		// - create a new memory if none exists! 
		console.log('Second startup!');


    // let ExternalIdentityNode = JSON.stringify(JSON.stringify({
    //   type: 'external_identity:0.0.1:local:8982f982j92',
    //   data: {
    //     publicKey: 'test1'
    //   },
    //   nodes: [{
    //     type: 'external_identity_connect_method:0.0.1:local:382989239hsdfmn',
    //     data: {
    //       method: 'http',
    //       connection: 'test1'
    //     }
    //   }]
    // }));

    // // add to ipfs (todo) 
    // let ipfsHash = 'test2';

    // let request = require('request');

    // let ipfsReqData = JSON.parse('{"operationName":null,"variables":{"hash":"'+ipfsHash+'","text":'+ExternalIdentityNode+'},"query":"mutation ($hash: String    $text: String) {  ipfsFileCreate(record: {hash: $hash   text: $text}) {    recordId    __typename  }}"}');

    // let ipfsResult = await request.post({
    //   method: 'post',
    //   url: process.env.LANGUAGE_SERVER, //'http://docker.for.mac.localhost:7011/graphql',
    //   body: ipfsReqData,
    //   json: true
    // })


  	console.log('Second Now Ready (loaded, nothing AT ALL run yet tho (learnBasics might run))');
  	secondReadyResolve(); //

    // fetch and run code, pass in 
    let nodesInMemory = await app.graphql.fetchNodesSimple();

		app.nodesDb = nodesInMemory;
    console.log('NodesDb populated!', app.nodesDb.length);

    console.log('Nodes:', nodesInMemory.length);
    let totalNodes = 0;
    if(!nodesInMemory.length && nodesInMemory.length === 0){
    	console.log('Missing Nodes in Memory!! Loading default nodes:', BASIC_NODES[process.env.STARTUP_BASE].length);

    	// todo: should have a trigger for loading a new memory, maybe dont do it automatically? 

    	if(!BASIC_NODES[process.env.STARTUP_BASE]){
    		console.error('Missing STARTUP_BASE environment variable');
    		return false;
    	}

    	// Loading default nodes!
      const saveChildNodes = (nodeId, childNodes) => {
        return new Promise(async (resolve, reject)=>{
          
          for(let tmpNode of childNodes){
            let newChildNode = {
              nodeId,
              type: tmpNode.type,
              data: tmpNode.data,
            }
            totalNodes++;
						let savedChildNode = await app.graphql.newNode(newChildNode);

            if(tmpNode.nodes && tmpNode.nodes.length){

              await saveChildNodes(savedChildNode._id, tmpNode.nodes);

            }
          }
          resolve();
        });
      }

      for(let node of BASIC_NODES[process.env.STARTUP_BASE]){
      	totalNodes++;
      	let savedNode = await app.graphql.newNode(node);
        await saveChildNodes(savedNode._id, node.nodes);
      }

			// Update memory!
	    app.nodesDb = await app.graphql.fetchNodesSimple();

      console.log('Inserted Nodes! Total:', totalNodes, ' Root:', BASIC_NODES[process.env.STARTUP_BASE].length);

			// Now trigger "first" action 

      // Get ExternalIdentity Node for first request (MUST exist?) 
      // - storing internally, then removing and re-adding in the "learn" step 
    	let externalIdentityNodes = await app.graphql.fetchNodes({
    		type: 'external_identity:0.0.1:local:8982f982j92'
    	});

    	let externalIdentityNode = externalIdentityNodes.length ? externalIdentityNodes[0]:null;

      if(!externalIdentityNode){
        console.error('Missing ExternalIdentity on startup (this is ok in the cloud)');
        // return false;
      }

      // run "first" action
      let firstResponse = await this.runRequest({
        type: 'incoming_first:0.1.1:local:78882h37',
        data: externalIdentityNode // arrives as INPUT
      }, true)

      console.log('firstResponse', firstResponse);


    }

	}
	runRequest(InputNode, skipWrappingInputNode){

    // wait for memory to be ready!
    return new Promise((resolve, reject)=>{

    	console.log('Waiting for secondReady for runRequest');

			let thisRequestId = uuidv4();
			requestsCache[thisRequestId] = {
				keyvalue: {},
				stack: []
			};

			// clear request cache after 30 seconds 
			setTimeout(()=>{
				delete requestsCache[thisRequestId];
			}, 30 * 1000);

      secondReady.then(async ()=>{
        console.log('Running web request:', InputNode); //, this.state.nodesDb);

        // fetch and run code, pass in 
        let nodes = await app.graphql.fetchNodes({
          type: 'incoming_from_universe:0.0.1:local:298fj293'
        });

        // console.log('NODES:', nodes);
        if(!nodes || !nodes.length){
          console.error('Missing incoming_from_universe:0.0.1:local:298fj293 Node');
          return;
        }

        let nodeId = nodes[0]._id;
        let CodeNode = _.find(nodes[0].nodes,{type: 'code:0.0.1:local:32498h32f2'});

        if(!CodeNode){
          console.error('Missing code:0.0.1:local:32498h32f2 to handle incoming_browser_request');
          return;
        }

        let UniverseInputNode = {};

        if(skipWrappingInputNode){
          UniverseInputNode = InputNode;
        } else {
          UniverseInputNode = {
            type: 'incoming_web_request:0.0.1:local:29832398h4723',
            data: InputNode
          }
        }

        // console.log('UniverseInputNode',UniverseInputNode);
        // console.log('CodeNode',CodeNode);



	      // Set context
	      let safeContext = {
	        // subject: tmpSubject,
	        // pointer,
	        SELF: CodeNode, 
	        INPUT: UniverseInputNode, // this is NOT validated at this step, cuz we are just passing in a Node (type, data) that I can decide how to handle. Ideally the passed-in schema types includes:  (inputData, outputFormat/info)
	        // user: context.user, // user._id (this should be the datasource, or auth, or something else??) (might have Auth provided over the top, or assumed?)
	      }
	      let threadEventHandlers = {};
	      // console.log('RunSafe1');

	      // this should be updateable through ipc from the ai! 
	      let requires = [
	      	// 'vm2',
	      	// '@stdlib/stdlib',
	      	'lodash'
	      ];

	      // console.log('BODY', JSON.stringify(req.body,null,2));

	      // this is NOT limited 
	      // - let the brain handle responses! 
	      // - potentially the brain could install software that watches this and prevents more attacks, but doesn't need to be built-in 

	      let safedData;
	      console.log('thisRequestId1:', thisRequestId);
	      try {
		      safedData = await runSafe({ 
		      	code: CodeNode.data.code, 
		      	safeContext, 
		      	requires, 
		      	threadEventHandlers, 
		      	requestId: thisRequestId, 
		      	mainIpcId, // from top of file
		      	nodeId, 
		      	timeout: 20 * 1000 
		     	})
		    }catch(err){
		    	safedData = {
		    		type: 'err:2390',
		    		data: {
		    			msg: 'Failed safedData',
		    			err,
		    			errStr: (err && err.toString) ? err.toString():err // might be undefined!
		    		}
		    	}
		    }


		    return resolve(safedData);


        // // run in vm
        // let responseNode;
        // // try {
        // //   responseNode = await runSafe(CodeNode, UniverseInputNode);
        // // }catch(err){
        // //   console.error('In VM error:', err);
        // //   responseNode = {
        // //     type: 'err_in_vm:3',
        // //     data: {
        // //       err: err || {},
        // //       error: err
        // //     }
        // //   }
        // // }

        // console.log('ResponseNode:', responseNode);

        // resolve(responseNode);

      })

    });

	}
}

let MySecond = new Second();


const incomingAIRequest = ({ req }) => {

	return new Promise(async (resolve, reject)=>{

		// Immediately pass off "incomingAIRequest" to a function 
		// - essentially, "find the Subject w/ PointerType incomingAIRequest and pass in the data, running in_sandbox" 
		// - only have two functions available by default: in_sandbox (respects whatever rules you have), out_sandbox (makes a command line request, uses a common schema) 
		//   - are they just available "Actions" ?? 

		// use a consistent mechanism (that lives as an Action) for running "additional Actions" 
		// - Actions can be called from any function (right?) 
		//   - the routing can handle 


		// Start the AI 
		// - incoming Request is added as new data? 
		// - the new data is acted on? 

		// Passing in the action+data to the AI? 
		// - the environment parses the action+data, and passes that in accordingly? 
		// - or just passing in a blob of data, and allowing the AI to processes that?? (that would be a specific schema I suppose?) 

		// Find first Node with type: "incoming_web_request:0.0.1:local:29832398h4723" (different from a websocket request!) 
		// - the data contains code. Create a VM for the code in that data, pass in the req.body information according to the Schema! 
		//   - the req.body is expected to be in the correct format for hanlding a web request! 

		// var blockexplorer = require('blockchain.info/blockexplorer').usingNetwork(5)

		// create "request object" 
		// - keeping a cache of "things in this request" (such as auth, etc.) 
		// // - session, etc? 
		// let thisRequestId = uuidv4();
		// requestsCache[thisRequestId] = {
		// 	keyvalue: {},
		// 	stack: []
		// };

		// req.body SHOULD be a node! 
		// - todo: should validate schema 
		let response = await MySecond.runRequest(req.body);

		return resolve({
			secondResponse: {
				type: 'output_generic:0.0.1:local:239f2382fj2983f',
				data: response
			}
		});



		// let nodes = await app.graphql.fetchNodes({
		// 	nodeId: null,
		// 	// type: 'incoming_from_universe:0.0.1:local:298fj293',
		// 	type: 'incoming_web_request:0.0.1:local:29832398h4723'
		// 	// type: 'incoming:0.0.1:local:329fjs98dhf23ff3'
		// });

		// console.log('Nodes for incoming_from_universe:', nodes.length); 

		// // Pass in "how to break out of your environment" and "how to validate things" as possible actions? 
		// // - "how to validate" should be consistent? 
		// // - somehow have "global" functions that can be called from any other code function? 
		// //   - these exist in the runSafe code (ThreadedRunSafe)....but also should be called via ipc (above) or some other consistent (and repeatble) packaging mechanism? 

		// // this should be a code block? 
		// // - the schema should define the other types?? 
		// // - or have it immediately look for the Code Block associated with an incoming request? 


		// // We are expecting/requiring that the node with type: incoming_web_request... will have a consistent format for the data 
		// // - validate it 


		// // todo: run jsSchema validation 
		// // - pass in type/id and retrieve from Languages Table (bitcoin) 

		// // Schema = schema({
		// // 	dataSchema: ...,
		// // 	inputSchema: ..., // props
		// //   outputSchema: ...,
		// //   '*':null
		// // })

		// let safedData = null;

		// if(nodes.length == 1){

		// 	// load some info from the schema before requesting data? 
		// 	// - load the "code" from the ChildNode
		// 	// could also define by a further pointer?? 
		// 	let codeNode = _.find(nodes[0].nodes,{type:'code:0.0.1:local:32498h32f2'});
		// 	let nodeId = nodes[0]._id;

		// 	// runCode(code, req.body); // "body" should be a `{type: "xyz", data: {..}}` format (a Node) 



  //     // Set context
  //     let safeContext = {
  //       // subject: tmpSubject,
  //       // pointer,
  //       SELF: codeNode, 
  //       INPUT: req.body, // this is NOT validated at this step, cuz we are just passing in a Node (type, data) that I can decide how to handle. Ideally the passed-in schema types includes:  (inputData, outputFormat/info)
  //       // user: context.user, // user._id (this should be the datasource, or auth, or something else??) (might have Auth provided over the top, or assumed?)
  //     }
  //     let threadEventHandlers = {};
  //     // console.log('RunSafe1');

  //     // this should be updateable through ipc from the ai! 
  //     let requires = [
  //     	// 'vm2',
  //     	// '@stdlib/stdlib',
  //     	'lodash'
  //     ];

  //     // console.log('BODY', JSON.stringify(req.body,null,2));

  //     // this is NOT limited 
  //     // - let the brain handle responses! 
  //     // - potentially the brain could install software that watches this and prevents more attacks, but doesn't need to be built-in 

  //     console.log('thisRequestId1:', thisRequestId);
  //     safedData = await runSafe({ 
  //     	code: codeNode.data.code, 
  //     	safeContext, 
  //     	requires, 
  //     	threadEventHandlers, 
  //     	requestId: thisRequestId, 
  //     	mainIpcId, // from top of file
  //     	nodeId, 
  //     	timeout: 20 * 1000 
  //    	})
  //     // we can expect safedData to match the outputSchema schema from incoming_web_request...
  //     // - the idea is that it can NEVER respond outside the outputSchema, otherwise what is sent back is ignored! 
  //     //   - could always send data to the incoming request caller a different way, but the response must be the requested format! 

		// } else {
		// 	console.error('Had multiple nodes, or none!');
		// }


		// // Find Code -> Run Code with Parameters and access to XYZ functions (environment functions) 
		// // - when running, code handles verification of schema (it knows what type it is?) 
		// // - could also be done automatically when calling? ...AI handles it? No real "rules" just "best practices" so your AI responds smartly

		// // ALWAYS outputs a Node! 
		// // - error, etc. 
		// resolve({
		// 	secondResponse: {
		// 		type: 'output_generic:0.0.1:local:239f2382fj2983f',
		// 		data: safedData
		// 	}
		// });






				// await requestData({
				// 	AuthUser, // single subject/pointer (could be null!) 
				// 	ActionSchema,
				// 	ActionData, // includes query with code, likely multiple datasources! (mine, remote/friends) 
				// 	ResponseSchema, // dont really need to include? 
				// 	ResponseHandler // for returning the response (handled on this page) 
				// });


		// All of the code below should be in-data (as part of a Code Block that is called from above, with correct input schema) 


		// depending on the type of request (websocket, http, for data, an action, etc.) either return immediately or do something else
		// - caller gets to define how they want to be told! 

		// do NOT async yet! 
		// - don't let the caller off the hook (they haven't told us how they want to receive a response, and we haven't decided if that is OK yet) 

		// get the AuthUser for the request 
		// - input can be a JWT from an App, nobody (if not auth'd yet, handle login!), or other AI/friend/company datasource
		// - input should also have AuthSchema that defines what type of request it is! 
		// - function: fetch_authuser_for_request
		// - returns a single Subject/Pointers (if multiple match, then Error!) 

		// validate the ActionSchema (which is simply passed as a String) 
		// - aka "do I know how to handle this Action, given X data?" 
		//   - lookup ActionSchema from internal data (look for an active Subject with PointerType of correct schema, 1st matching result) 

		// Decide if AuthUser is allowed to run this ActionSchema 
		// - function: authuser_allowed_to_run_action 
		// - inputs: AuthUser, ActionSchema, 

		// Decide how to return the result (wait for output before res.send, send incrementally via websocket after sending resultID via res.send(), call different endpoint, notify other AI, etc.) 
		// - most common: wait_for_output (coming from an HTTP request) 
		// - may also depend on ActionSchema 
		// - user supplied a ResponseSchema/OutputSchema  (Could be "store the output in the AI cache" or "output the result to an ML algorith!)
		// - function: resolve_how_to_return_input 
		// - inputs: AuthUser, ActionSchema SubjectPointers, ResponseSchema Subject/Pointers, Possible Options available to the AI?, (ability to query for more subjects/pointers and evaluate them?) 
		// - returns: what to do (return immediately using a resultID for websockets, say the OutputSchema isn't supported, etc. )  

		// Run GasCost check 
		// - see what the user is offering for Gas, what we are allowing, etc. 
		// - function: check_gas_cost 
		// - input: AuthUser, GasOffered (verified?), ActionSchema, ActionData 
		// - output: allowed to continue, or more needed? Uses a valid OutputSchema that *should* include a way to negotiate GasCost? 

		// may be returning a response now 
		// - sets up a data channel to return the response? 


		// Run the ACTION, with the input! 
		// - or if the action doesn't exist, die? 
		// - action is supposed to be a "local" application, with additional `yarn add` packages, etc. 
		// - input is according to the ActionSchema (so we know exactly what data to expect!) 

		// Should all actions be installed as separate apps? 
		// - seems to make sense to keep it as distributed as possible
		// - maybe all actions except `query_datasources` ? 
		//   - what if somebody doesn't want to be able to do any querying, yet still wants to have a place on the network?? 

		// switch(action){

		// 	// query local datasources (local and remote), includes how to handle "delayed" results 
		// 	// - datasource has info for "where is this datasource, how do I connect/send to it, and how do I auth with it) 
		// 	// - this is used in a 1-2-step by an App for querying for "all friends" (it gets all Datasources first, then says "query these datasources") 
		// 	case 'query_datasources_v1:local:2947329754334': // I better do something fun with this fucking ID, everyone will get to see it 
		// 		// standard way of querying datasources that an AI has access to 
		// 		// - both local, and remote! (mine, and friends) 
		// 		// - eventually this should handle caching also 
		// 		await requestData({
		// 			AuthUser, // single subject/pointer (could be null!) 
		// 			ActionSchema,
		// 			ActionData, // includes query with code, likely multiple datasources! (mine, remote/friends) 
		// 			ResponseSchema, // dont really need to include? 
		// 			ResponseHandler // for returning the response (handled on this page) 
		// 		});
		// 		break;

		// 	case 'send_request_to_datasource:local:23f9hjs89fh9s8df':
		// 		// make a request to a local datasource 
		// 		break;

		// 	case 'convert_text_to_command:local:39jsjf9f032jds':
		// 		// text was submitted, convert it to a "likely command" 
		// 		// - 
		// 		break;

		// 	case 'install_capability:local:8329fj2389jsf23':
		// 		// install an application using `yarn add` ! 
		// 		// - this is how additional capabilities can be added to an AI :) 
		// 		// - because we're running inside a Docker container, installing new things is a'ok! (it only affects my instance!) 
		// 		break;

		// 	case 'add_timing_event:local:sdkfj829j9j8392jf3':
		// 		// trigger something to happen at a later date 
		// 		// - should be checking the "what to run later" against a schema (must be one of the other ) 
		// 		break;


		// 	// enable other actions through apps? 
		// 	// - would require additional `yard add` stuff? How to do that without corrupting other installations? 
		// 	// - entire reason for running in a Docket container! 
		// 	case '...':
		// 		break;

		// 	default:

		// }

		// Now that I have a result/output: check the previous OutputSchema result to see what I should do with the output data 
		// - could be pushing onto a websocket queue, or just returning the data, or sending it somewhere else (?) 

	});

}



// Your AI is going to look for the data in its memory, but if you delete it, then it wont be able to find it. Just like removing a part of your brain, you cant just wish it back in place! 
// - "surgery" is performed by bypassing your AIs controls on data and directly editing the database 

export default incomingAIRequest;
export {
	incomingAIRequest,
	MySecond
}



// Proof-of-X network is storing: 
// - txId: js-schema for something (PointerType, ActionInput) 







