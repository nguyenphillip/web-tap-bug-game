
// Game Variables
var canvas = document.getElementById("game");
var context = canvas.getContext("2d");
var gameWidth = canvas.width;
var gameHeight = canvas.height;
var mouseRadius = 30;
var delay = 10;
var level=1;
var gameOverState;
var gamePauseState;
var gameStartState;
var gameComplete;
var updateGameInterval;


// Time and Score Variables
var initialTime = 60;
var time;
var score;
var highscores = [0, 0];
var timer;
var timerButton = document.getElementById("timerButton");
var resetButton = document.getElementById("resetButton");
var startButton = document.getElementById("startButton");
var levelRadios = [];
levelRadios = document.getElementsByTagName("input");
levelRadios[0].checked=true;

// Food Variables
var foodHeight = 20;
var foodWidth = 20;
var foodRadius = foodHeight/2;
var foodList = [];
var food = function(x, y){
	this.x = x;
	this.y = y;
	this.eaten = false;
}

// Bug Variables
var bugHeight = 40;
var bugWidth = 10;
var rotateIncrement = 0.08;
var bugTypes = ["black", "red", "orange"];
var bugSpeeds = [[150, 200], [75,100], [60, 80]];
var bugScores = [5, 3, 1];
var bugTimer;
var bugList = []
var bug = function(x, y, type, level){
	this.x = x;
	this.y = y;
	if (!isNaN(type)){
		this.type = type;
	}
	else{
		this.type = bugTypes.indexOf(type);
	}
	this.speed = bugSpeeds[this.type][level-1];
	this.score = bugScores[this.type];
	this.rotation = 0.5 * Math.PI;
	this.target;
	this.rotate = false;
	this.blocked = false;
	this.killed =false;
	this.fade = 1;
	this.dead = false;
}

function showElement(elementID){
	var element = document.getElementById(elementID);

	element.style.display = 'block';
}

function hideElement(elementID){
	var element = document.getElementById(elementID);

	element.style.display = 'none';
}


function getPosition(event){
	var x = event.offsetX;
	var y = event.offsetY;

	if  (!gameOverState && ! gamePauseState){
		killBug(x, y);
	}

	if (gameOverState && x<300 && x>100 && y<300 && y>250){
		restartGame();
	}
	if (gameOverState && x<300 && x>100 && y<370 && y>320){
		exitGame();
	}	
}

function killBug(x, y){
	for (i=0; i < bugList.length; i++){
		var d = distance(x, y, bugList[i].x, bugList[i].y);
		if (d < mouseRadius + bugHeight/2 && !bugList[i].killed){
			bugList[i].killed = true;
			updateScore(bugList[i].score);
		}
	}
}

function updateScore(num){
	score += num;
	document.getElementById("score").innerHTML = "Score: " + score; 
}

function updateHighscore(){
	if (score > highscores[level-1]){
		highscores[level-1] = score;
	}
	localStorage.setItem("highscores", highscores);
}

function loadHighscores(){
	if (localStorage.getItem("highscores") != null){
		highscores = localStorage.getItem("highscores").split(",");
	} 
}

function clearHighscore(){
	localStorage.removeItem("highscores");
}

function resetHighscore(){
	highscores[level-1] = 0;
	localStorage.setItem("highscores", highscores);
	document.getElementById("highscore").innerHTML = "Highscore: " + 0;
}


function updateTimer(){
	time--;
	document.getElementById("timer").innerHTML = "Time: " + time; 
	if (time <= 0){
		time == 0;
		gameOverState = true;
	}
}

function pauseTimer (){
	
	if (!gamePauseState && !gameOverState){
		timerButton.innerHTML = "Resume";
		window.clearInterval(timer);
		window.clearInterval(bugTimer);
		window.clearInterval(updateGameInterval);

		gamePauseState = true;	
	}
	else{
		timerButton.innerHTML = "Pause";
		timer = setInterval(updateTimer, 1000);
		bugTimer = setInterval(generateBug, Math.floor(Math.random() * 3 + 1) * 1000);
		updateGameInterval = setInterval(gameLoop, delay);
		gamePauseState = false;
		
	}
}

function generateFood(num){
	for (i = 0;  i < num; i++){	
		var overlap;
		var x;
		var y;

		do{
			overlap = false;
			
			// X can only be in the lower 80% of the game screen (also food will be inside borders)
			x = Math.floor(Math.random() * (gameWidth - foodWidth) + foodRadius);
			y =Math.floor(Math.random() * (0.8*gameHeight - foodHeight) + 0.2*gameHeight + foodRadius);

			// Check if any foods are overlapping with the generated x and y
			for (i = 0.; i < foodList.length; i++){
				if (x < foodList[i].x+foodWidth && x > foodList[i].x-foodWidth && y < foodList[i].y+foodHeight && y > foodList[i].y-foodHeight){
					overlap = true;
				}
			}
		}
		while(overlap);

		foodList.push(new food(x,y));
	}
}

function generateBug(){
	var p = Math.floor(Math.random() * 10 + 1);
	var x = Math.floor(Math.random() * 380 + 10); // from 10 to 390
	var newBug;

	if (p <= 3){
		newBug = new bug(x, 0, "black", level);
	}
	else if (p <= 6){
		newBug = new bug(x, 0, "red", level);
	}
	else{
		newBug = new bug(x, 0, "orange", level);
	}

	bugList.push(newBug);

	findTarget(newBug);

	// Reset the timer to generate a new bug
	window.clearInterval(bugTimer);
	bugTimer = setInterval (generateBug, Math.floor(Math.random() * 3 + 1) * 1000);
}

function distance (x1, y1, x2, y2){
	var x = x1 - x2;
	var y = y1 - y2;
	var d = Math.sqrt(x*x + y*y);

	return d;
}

function findTarget (bug){
	var min_distance = Number.MAX_VALUE;
	var target;

	for (i = 0; i < foodList.length; i++){
		var d = distance(bug.x, bug.y, foodList[i].x, foodList[i].y);
		if (!foodList[i].eaten && d < min_distance){
			min_distance = d;
			target = foodList[i];
		}
	}
	bug.target = target;
}

function rotateBug(bug){
	var rotation = Math.atan2(bug.target.y - bug.y, bug.target.x - bug.x);

	if (rotation < 0){
		rotation += 2*Math.PI;
	}

	var dif = bug.rotation - rotation;
	var rot = (dif + 2 * Math.PI) % (2 * Math.PI);

	if (Math.abs(dif) <= 2*rotateIncrement){
		bug.rotation = rotation;
		bug.rotate = false;
	}
	else if (rot > Math.PI){
		bug.rotation += rotateIncrement;
		bug.rotate=true;
	}
	else if (rot < Math.PI){
		bug.rotation -= rotateIncrement
		bug.rotate = true;
	}

	if (bug.rotation > 2 * Math.PI){
		bug.rotation -= 2 *Math.PI;
	}else if (bug.rotation < 0){
		bug.rotation += 2 * Math.PI;
	}
}

function checkPathBlocked(bug, x, y){
	var blocked = false;
	console.log(bug.id, x, y);
	for (i=0 ; i < bugList.length; i++){
		if (bugList[i] != bug){
			var d = distance (x, y, bugList[i].x, bugList[i].y);
			console.log("d ", d);
			console.log("p" , bugList[i].id, bugList[i].x, bugList[i].y); 
			if (d < 10){
				console.log("true");
				blocked = true;
			}
		}
	}
	bug.blocked = blocked;
}

function updateBug (bug){
	if (!gameOverState){
		if (bug.target.eaten){
			findTarget(bug);
		}

		rotateBug(bug);

		if (!bug.rotate){	
			var dx = bug.target.x - bug.x;
			var dy = bug.target.y - bug.y;
			var d = distance (bug.x, bug.y, bug.target.x, bug.target.y);
			var vx = dx/d * bug.speed/(1000/delay);
			var vy = dy/d * bug.speed/(1000/delay);
			//checkPathBlocked(bug, bug.x + 5 * vx, bug.y + 5 * vy );
			//if (!bug.blocked){
			if (d > bugHeight/2 + foodRadius){
				bug.x += vx;
				bug.y += vy;
			}
			else {
				destroyFood(bug.target);
			}
		}
	}
}

function destroyFood(food){
	food.eaten = true;
	var gameOver = true;
	for (i=0 ; i < foodList.length; i++){

		if (!foodList[i].eaten){
			gameOver = false;
		}
	}
	gameOverState = gameOver;
}



function updateGame(){
	for (i = 0; i < bugList.length; i++){
		if (!bugList[i].killed){
			updateBug(bugList[i]);
		}
	}
}

function drawGame(){
	for (i = 0; i < foodList.length; i++){
		drawFood(foodList[i]);
	}
	for (i = 0; i < bugList.length; i++){
		if (!bugList[i].dead){
			drawBug(bugList[i]);
		}
	}
}

function drawFood(food){
	if (!food.eaten){
		var x = food.x;
		var y = food.y;
		context.save();
		context.beginPath();
		context.arc(x, y, 10, 0, 2*Math.PI);
		context.closePath();
		context.fillStyle = '#FFCC66';
		context.fill();

		context.fillRect(x-14, y-10, 2, 2);
		context.fillRect(x-10, y-11, 2, 2);
		context.fillRect(x+9, y+10, 3, 3);
		context.fillRect(x-11, y+9, 2, 2);
		context.fillStyle = '#663300';
		context.fillRect(x, y, 2, 2);
		context.fillRect(x-5, y +1, 3, 3);
		context.fillRect(x-6, y -4, 3, 3);
		context.fillRect(x+4, y-3, 3, 3);
		context.fillRect(x+5, y+2, 2, 2);
		context.fillRect(x, y-7, 3, 3);
		context.fillRect(x+1, y+4, 3, 3);
		context.strokeStyle ='#663300';
		//context.stroke();
		context.restore();
	}
}

function drawBug(bug){
	var x = bug.x;
	var y = bug.y;
	context.save();
	context.translate(bug.x, bug.y);
	context.rotate(bug.rotation);
	fadeBug(bug);
	//context.rect(-20, -5, bugHeight, bugWidth);
	//context.stroke();
	context.scale(1.5, 1);
	context.beginPath();
	context.arc(7, 0, 4, 0, 2*Math.PI);
	context.arc(0, 0, 3, 0, 2*Math.PI);
	context.arc(-8, 0, 5, 0, 2*Math.PI);
	context.closePath();
	context.fillStyle = bugTypes[bug.type];
	context.fill();

	context.strokeStyle = bugTypes[bug.type];
	context.beginPath();
	context.moveTo(-6,5);
	context.lineTo(-11,8);
	context.closePath();
	context.stroke();
	context.beginPath();
	context.moveTo(-6,-5);
	context.lineTo(-11,-8);
	context.closePath();
	context.stroke();
	context.beginPath();
	context.moveTo(0,2);
	context.lineTo(-5,8);
	context.closePath();
	context.stroke();
	context.beginPath();
	context.moveTo(0,-2);
	context.lineTo(-5,-8);
	context.closePath();
	context.stroke();
	context.beginPath();
	context.moveTo(4,-3);
	context.lineTo(9,-8);
	context.closePath();
	context.stroke();
	context.beginPath();
	context.moveTo(4,3);
	context.lineTo(9,8);
	context.closePath();
	context.stroke();
	context.beginPath();
	context.moveTo(11,2);
	context.lineTo(13,3);
	context.closePath();
	context.stroke();
	context.beginPath();
	context.moveTo(11,-2);
	context.lineTo(13,-3);
	context.closePath();
	context.stroke();
	
	context.restore();
	if (bug.killed && !bug.dead){
		context.fillText("+" + bug.score, x + 5, y + 5);
	}
}

function fadeBug(bug){
	if (bug.killed && !bug.dead){
		context.globalAlpha = bug.fade;
		bug.fade -= 1/(2 * 1000/delay);
		if (bug.fade <= 0){
			bug.fade = 0;
			bug.dead = true;
		}
	}
}

function drawGameOver(){
	context.save();
	context.font = "40px Arial";
	context.fillText("Game Over!", 100, 100);
	context.font = "14px Arial";
	context.fillText("Level " + level, 110, 120);
	context.font = "20px Arial";
	context.fillText("Score: " + score, 110, 160);
	context.fillText("Highscore: " + highscores[level-1], 110, 180);
	context.font = "30px Arial";
	context.fillText("Restart", 145, 285);
	context.fillText("Exit", 175, 355);
	context.beginPath();
	context.rect(100, 250, 200, 50);
	context.closePath();
	context.stroke();
	context.beginPath();
	context.rect(100, 320, 200, 50);
	context.closePath();
	context.stroke();
	context.restore();
}


function clearLists(){
	bugList.filter(clearBugs);
	foodList.filter(clearFood);
}

function clearBugs(bug){
	return !bug.dead;
}

function clearFood(food){
	return !food.eaten;
}

function gameOver(){
	window.clearInterval(timer);
	window.clearInterval(bugTimer);
	window.clearInterval(updateGameInterval);

	updateHighscore();

	if (level==1){
		if (time==0){
			level = 2;
			initializeGame();
		}
		else{
			drawGameOver();
		}
	}
	else if (level == 2){
		if (time==0){
			gameComplete=true;
		}
		else{
			gameComplete=false;
		}

		drawGameOver();
	}
}

function gameLoop(){
	context.clearRect(0, 0, gameWidth, gameHeight);
	
	if (!gameOverState){
		updateGame();
		clearLists();
		drawGame();
		context.save();
		context.font = "14px Arial";
		context.fillText("Level " + level, 5, 600);
		context.restore();
	}
	else{
		gameOver();
	}

}



function startGame(){
	hideElement("startPage");
	showElement("gameContent");
	
	initializeGame();	
}

function restartGame(){
	if (gameComplete){
		gameComplete = false;
		level = 1;
	}
	initializeGame();
}

function exitGame(){
	hideElement("gameContent");
	showElement("startPage");
	for (i = 0; i < levelRadios.length; i++){
		if (levelRadios[i].checked){
			document.getElementById("highscore").innerHTML = "Highscore: " + highscores[i];
		}
	}
}

function radioClick(radio){
	level = radio.value;
	document.getElementById("highscore").innerHTML = "Highscore: " + highscores[level-1];
}

function initializeGame(){
		// Initialize variables
	foodList = [];
	bugList = [];
	gameOverState = false;
	gamePauseState = false;
	gameStartState = true;	
	time = initialTime;
	score = 0;
	document.getElementById("timer").innerHTML = "Time: " + time;
	document.getElementById("score").innerHTML = "Score: " + score;

	canvas.addEventListener("mousedown", getPosition, false);
	timerButton.addEventListener("click", pauseTimer);

	generateFood(5);

	// Set intervals
	updateGameInterval = setInterval(gameLoop, delay);
	timer = setInterval(updateTimer, 1000);
	bugTimer = setInterval (generateBug, Math.floor(Math.random() * 3 + 1) * 1000);
}

hideElement("gameContent");
//clearHighscore();
loadHighscores();
startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetHighscore);
document.getElementById("highscore").innerHTML = "Highscore: " + highscores[0];

