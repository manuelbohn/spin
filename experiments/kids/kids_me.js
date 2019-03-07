// preload
var preObjects = ["pawn.png","horseshoe.png","carrot.png","barrel.png","papaya.png","bread.png","apple.png","duck.png","garlic.png","kite.png","eggplant.png","plug.png","duck.png","car.png","bear.png","ball.png","t01.png", "t02.png", "t03.png", "t04.png", "t05.png", "t19.png", "t07.png", "t08.png", "t09.png", "t10.png", "t11.png", "t12.png", "t13.png", "t14.png", "t15.png", "t16.png", "t17.png", "t18.png","t20.png","t21.png","t22.png","back1.jpg","back2.jpg","back3.jpg","back4.jpg","back5.jpg","back6.jpg","back7.jpg","back8.jpg","back9.jpg","back10.jpg","empty.png"];
//for critical trials and fillers
var images = new Array();
for (i = 0; i < preObjects.length; i++) {
	images[i] = new Image();
	images[i].src = "images/" + preObjects[i];
    images[i].id = preObjects[i];
}


var preSounds = ["Frog_choice.mp3", "Mouse_choice.mp3", "Bear_choice.mp3", "Beaver_choice.mp3", "Monkey_choice.mp3", "Dog_choice.mp3", "Cat_choice.mp3", "Bunny_choice.mp3", "Tiger_choice.mp3", "Sheep_choice.mp3","Pig_choice.mp3","Pig_train.mp3","Elephant_choice.mp3","Frog_hello.mp3", "Mouse_hello.mp3", "Bear_hello.mp3", "Monkey_hello.mp3", "Dog_hello.mp3", "Cat_hello.mp3", "Bunny_hello.mp3", "Tiger_hello.mp3", "Sheep_hello.mp3","Pig_hello.mp3","Elephant_hello.mp3", "Beaver_hello.mp3"];
//for critical trials and fillers
var sound = new Array();
for (i = 0; i < preSounds.length; i++) {
	sound[i] = new Audio();
	sound[i].src = "sound/" + preSounds[i];
}

// ## Helper functions
function showSlide(id) {
  // Hide all slides
	$(".slide").hide();
	// Show just the slide we want to show
	$("#"+id).show();
}

function showText(id) {
  // Hide all slides
	$(".text").hide();
	// Show just the slide we want to show
	$("#"+id).show();
}


function showAgent(id, orient) {
	$(".agent").hide();
    $(".point_agent_l").hide();
    $(".point_agent_r").hide();
	$("#"+id+"_"+orient).show();
}

function hideAgent() {
  // Hide all slides
	$(".agent").hide();
}

function choiceAgent(id) {
  // Hide all slides
	$(".agent").hide();
	// Show just the agent we want to show
	$("#"+id+"_straight").show();
}

function sourceRightObject(a) {
        document.getElementById("object_r").src=a;
    };

function sourceLeftObject(b) {
        document.getElementById("object_l").src=b;
    };


function showRightObject() {
    document.getElementById('object_r').style.visibility='visible';
      };

function hideRightObject() {
    document.getElementById('object_r').style.visibility='hidden';
      };

function showLeftObject() {
    document.getElementById('object_l').style.visibility='visible';
      };


function hideLeftObject() {
    document.getElementById('object_l').style.visibility='hidden';
      };

function showEat(id) {
	$(".agent_eat").hide();
	$("#"+id+"_eat").show();
};

function choiceLeftObject(a) {
        document.getElementById("choiceObject_l").src=a;
    };


function choiceRightObject(a) {
        document.getElementById("choiceObject_r").src=a;
    };


function background(x) {
        document.getElementById("background").src=x;
    };

function background2(x) {
        document.getElementById("background2").src=x;
    };

function getTime1() {
    return startTime = (new Date()).getTime();
};

// Get a random integer less than n.
function randomInteger(n) {
	return Math.floor(Math.random()*n);
};

function randomElement(array) {
  return array[randomInteger(array.length)];
};

function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}


function sourceSound(c) {
        document.getElementById("sound").src=c;
    };
function playSound() {
    document.getElementById("sound").play();
      };



  function pause(id,time){
      $("#"+id).hide();
      setTimeout(function() {
           $("#"+id).show();    
       }, time); 
    };



// Variables and randomization for the experiment

var trial = ["train1","train2",1,2,3,4,5,6,7,8,9,10,11,12]
// agent order for training
var trainAgents = ["Elephant","Pig"]
var allAgents = ["Elephant","Pig","Frog","Mouse","Monkey","Bunny","Dog","Bear","Tiger","Cat","Sheep","Beaver"];
// randomization of agent order for test trials
//var testAgents = allAgents.sort(() => .5 - Math.random()).slice(0,8);
var testAgents = shuffle(allAgents)
var agents = trainAgents.concat(testAgents);

var trainNovels = ["car","ball"];
var  testNovels= shuffle(["t01","t02","t03","t04","t19","t07","t08","t09","t11","t12","t14","t15","t16","t17","t20","t21"]);
var novels = trainNovels.concat(testNovels);

var trainFamiliars = ["t13","t10"];
var  testFamiliars= shuffle(["pawn","horseshoe","carrot","barrel","papaya","bread","apple","duck","garlic","kite","eggplant","plug"]);
var familiars = trainFamiliars.concat(testFamiliars);

// orientation of agent 
var agentOrient = [
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"],
    ["straight", "down"]];

// randomizing location of target object (i.e. single object)
var trainNovelPos = ["left", "right"];
var testNovelPos = shuffle(["left", "right", "left", "right", "left", "right", "left", "right", "left", "right", "left", "right"]);
var novelPos = trainNovelPos.concat(testNovelPos)

var back = shuffle([1,2,3,4,5,6,7,8,9,1,2,3,4,5]);


// beginning of actual experiment

// Show the instructions slide .
showSlide("instructions");

// the actual experiment
var experiment = {
  // Parameters for this sequence.
  trial: trial,
  agents: agents,
  agentOrient: agentOrient,
  novels: novels,
  familiars: familiars,
  back: back,
  novelPos: novelPos,
  data: [],
    
  checkInput: function() {
		//subject ID
		if (document.getElementById("subjectID").value.length < 1) {
			$("#checkMessage").html('<font color="red">You must input a subject ID</font>');
			return;
		}
        if (document.getElementById("subjectAge").value.length < 1) {
			$("#checkMessage").html('<font color="red">You must input a subject age</font>');
			return;
		}
		experiment.subid = document.getElementById("subjectID").value
        experiment.subage = document.getElementById("subjectAge").value
        experiment.trainingDot()
      }, 
    
// end of the experiment
  end: function() {
    // Show the finish slide.
    showSlide("finished");
    setTimeout(function() { turk.submit(experiment) }, 1000);
  },
    
   endTraining: function() {
    showSlide("training2");
  }, 
  
// what happens between trials - display agent from previous trial and click on it to move on to the next trial    
   eat: function(event) {
    
    setTimeout(function() {experiment.eat2() }, 1500);
       
    showSlide("choice");  
       
    event.target.style.border = '5px solid blue';
    
    sourceSound("sound/end.mp3");
    playSound();
    
       
    $(".object_r").unbind("click");
    $(".object_l").unbind("click");

      var pick_src = event.target.src;   
    // get time for reaction time
    var endTime = (new Date()).getTime();    
    // select correct object
      
       
    // Code correct: does name of chosen object contain the name of the correct object
    if (pick_src.indexOf(novels[0]) > -1) {
        var correct =1
        var pick = novels[0]
        } else {
        var correct = 0
        var pick = familiars[0]
        };
       
    var subid = experiment.subid; 
    var subage = experiment.subage;
    
    // data collected  
      data = {
        subid: subid,
        subage: subage,
        condition: "basic_me",
        trial: trial[0],
        agent: agents[0],
        novel: novels[0],
        familiar: familiars[0],
        pick: pick,
        position_novel: novelPos[0],
        pick_src: pick_src,
        correct: correct,
        rt: endTime - startTime,
            };
      experiment.data.push(data);
             
  },
 
eat2: function(event) {
    
    showSlide("eat");
    
   background("images/back"+back[0]+".jpg");
    
    sourceSound("sound/end.mp3");
    playSound();
   
    showEat(agents[0])
   
    $(".agent_eat").click(experiment.newtrial);     
  
},
    
// unbind and shift variables between trials      
 newtrial: function() {
    
    $(".object_l").css("border","none")

    $(".object_r").css("border","none")

     
    $(".agent_eat").unbind("click"); 
   
   
    sourceLeftObject("images/empty.png");
            showLeftObject(); 
    sourceRightObject("images/empty.png");
            showRightObject();

     
     
    experiment.trial.shift();   
    experiment.agentOrient.shift();   
    experiment.agents.shift();
    experiment.novelPos.shift();
    experiment.novels.shift();
    experiment.familiars.shift();
    experiment.back.shift(); 
     
 
  
  
   experiment.next();
  },


// recording the choice 
  choice: function(event) {
    
    showSlide("choice"); 
    
    background2("images/back"+back[0]+".jpg");
   
      showAgent(agents[0],"choice");
        
    // specify what is shown on the tables depending on training and test condition
    if (experiment.novelPos[0] == "left"){

        choiceLeftObject("images/"+novels[0]+".png");
      
        choiceRightObject("images/"+familiars[0]+".png");     
        
        } else {

        choiceLeftObject("images/"+familiars[0]+".png");
      
        choiceRightObject("images/"+novels[0]+".png");   
        
        } 
        
  
    // play choice sound
    if (experiment.trial[0] == "train1" || experiment.trial[0] == "train2"){
        sourceSound("sound/"+agents[0]+"_train.mp3");
        playSound();
    } else {
        sourceSound("sound/"+agents[0]+"_choice.mp3");
        playSound(); 
        };
      
    // choice can be made by clicking the objects after - possible after 5s
    setTimeout(function() {
        $(".object_l").click(experiment.eat);

        $(".object_r").click(experiment.eat);

    }, 5000);
  },
        
// moving on within a trial
    
  next: function() {
  // when training is over show sinished training slide 
    if (experiment.trial[0] == "finTrain"){
        experiment.endTraining();
        experiment.trial.shift();
        return;
    };
   // when no more trials are left, end experiment    
    if (experiment.trial.length == 0){
        setTimeout(function() {experiment.end() }, 0);
      return;
    };  
      
  // after exposure is finished, switch to choice      
    if (experiment.agentOrient[0][0] == "down") {
      setTimeout(function() {experiment.choice() }, 0);
      return;
    };  
    
    showSlide("stage");  
     
    background("images/back"+back[0]+".jpg")
      
    // show agent
    showAgent(agents[0],experiment.agentOrient[0][0]);
    
    // play hello sound and write name of agent
   if (experiment.agentOrient[0][0] == "straight") { 
        pause("next",1600); 
        sourceSound("sound/"+agents[0]+"_hello.mp3");
        playSound();
    }; 
     
    // display obejcts on table depending on training and test condition

    if (experiment.novelPos[0] == "left"){
        sourceLeftObject("images/"+novels[0]+".png");
        showLeftObject(); 

        sourceRightObject("images/"+familiars[0]+".png");
        showRightObject();

    } else  {
        sourceLeftObject("images/"+familiars[0]+".png");
        showLeftObject(); 

        sourceRightObject("images/"+novels[0]+".png");
        showRightObject();
    } 
      

    // move on to next phase of exposure
    experiment.agentOrient[0].shift(); 
  },
    
trainingDot: function() {
		
    function createDot(dotx, doty, i) {
	   var dots = [1, 2, 3, 4, 5];

	   var dot = document.createElement("img");
	   dot.setAttribute("class", "dot");
	   dot.id = "dot_" + dots[i];
	   dot.src = "dots/dot_" + dots[i] + ".jpg";

	   var x = Math.floor(Math.random() * 850);
	   var y = Math.floor(Math.random() * 550);

	   var invalid = "true";
	//make sure dots do not overlap
	   while (true) {  
		invalid = "true";
		for (j = 0; j < dotx.length; j++) {
			if (Math.abs(dotx[j] - x) + Math.abs(doty[j] - y) < 200) {
				var invalid = "false";
				break;
			}
		}
		if (invalid === "true") {
			dotx.push(x);
			doty.push(y);
			break;
		}
		x = Math.floor(Math.random() * 400);
		y = Math.floor(Math.random() * 400);
	}

	dot.setAttribute("style", "position:absolute;left:" + x + "px;top:" + y + "px;");

	trainingDot.appendChild(dot);
};

        
        var allDots = ["dot_1", "dot_2", "dot_3", "dot_4", "dot_5"];

		var xcounter = 0;
		var dotCount = 5;

		var dotx = [];
		var doty = [];

		for (i = 0; i < dotCount; i++) {
			createDot(dotx, doty, i, "");
		}

		showSlide("trainingDot");
		$('.dot').bind('click touchstart', function(event) {

			var dotID = $(event.currentTarget).attr('id');

			//only count towards completion clicks on dots that have not yet been clicked
			if (allDots.indexOf(dotID) === -1) {
				return;
			}
			allDots.splice(allDots.indexOf(dotID), 1);
			document.getElementById(dotID).src = "dots/x.jpg";
			xcounter++
			if (xcounter === dotCount) {
				trainingDot.removeChild(dot_1);
				trainingDot.removeChild(dot_2);
				trainingDot.removeChild(dot_3);
				trainingDot.removeChild(dot_4);
				trainingDot.removeChild(dot_5);

				setTimeout(function() {
					$("#trainingDot").hide();
					setTimeout(function() {
						showSlide("dotGame");
					}, 500);
				}, 500);
			}
		});
	}    
};

