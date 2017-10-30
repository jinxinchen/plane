var $body = $(document.body);


var planeFlag = 0;

var $canvas = $('#game');
var canvas = $canvas.get(0);
var context = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var canvasWidth = canvas.clientWidth;
var canvasHeight = canvas.clientHeight;

//判断是否有 requestAnimationFrame 方法，如果有则模拟实现
window.requestAnimFrame = 
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function(callback) {
	window.setTimeout(callback, 1000/30);
};

/**
*基本事件绑定
*
*/
function bindEvent(){
	var self = this;
	//点击开始按钮
	$body.on('click','.js-start',function(){
		$body.attr('data-status','start');
		GAME.start();
	});

	//点击说明按钮
	$body.on('click','.js-rule',function(){
		$body.attr('data-status','rule');
	});

	//点击设置按钮
	$body.on('click','.js-setting',function(){
		$body.attr('data-status','setting');
	});

	//点击确认按钮
	$body.on('click','.js-conform-setting',function(){
		// $body.backgroundImage = 'url(../img/bg_2.jpg)';
		console.log($("#bg").val());
		if($("#bg").val() == 0){
			$("body").css("background-image","url('./img/bg_1.jpg')");
		}else{
			$("body").css("background-image","url('./img/bg_2.jpg')");
		}
		if($("#plane").val() == 0){
			planeFlag = 0;
		}else{
			planeFlag = 1;
		}
		
		$body.attr('data-status','index');
	});

	//点击我知道了
	$body.on('click','.js-conform-rule',function(){
		$body.attr('data-status','index');
	});

	//游戏结束点击重玩
	$body.on('click', '.js-conform-again', function(event) {
		$body.attr('data-status','start');
		GAME.start();
	});

	$body.on('click', '.js-conform-end', function(event) {
		$body.attr('data-status','index');
	});
}


/**
*游戏对象
*
*/

var GAME = {
	init:function(opts){
		//设置opts，assign合成
		var opts = Object.assign({},opts,CONFIG);
		this.opts = opts;

		//计算飞机对象初始横坐标
		this.planePosX = canvasWidth / 2 - opts.planeSize.width / 2;
		this.planePosY = canvasHeight - opts.planeSize.height - 50;
	},

	start:function(){
		//获取游戏初始化
		var self = this; //GAME
		var opts = this.opts;
		var images = this.images;
		//清空射击目标，分数置为0
		this.enemies = [];
		this.score = 0;


		// 随机生成大小敌机
	    this.createSmallEnemyInterval = setInterval(function () {
	      self.createEnemy('normal');
	    }, 500);
	    this.createBigEnemyInterval = setInterval(function () {
	      self.createEnemy('big');
	    }, 1500);


	    //创建飞机
	    if(planeFlag == 0){
	    	this.plane = new Plane({
		    	x: this.planePosX,
			    y: this.planePosY,
			    width: opts.planeSize.width,
			    height: opts.planeSize.height,
			    // 子弹尺寸速度
			    bulletSize: opts.bulletSize, 
			    bulletSpeed: opts.bulletSpeed, 
			    // 图标相关
			    icon: resourceHelper.getImage('pinkPlaneIcon'),
			    bulletIcon: resourceHelper.getImage('fireIcon'),
			    boomIcon: resourceHelper.getImage('enemyBigBoomIcon')
		    });
	    }else{
	    	this.plane = new Plane({
		    	x: this.planePosX,
			    y: this.planePosY,
			    width: opts.planeSize.width,
			    height: opts.planeSize.height,
			    // 子弹尺寸速度
			    bulletSize: opts.bulletSize, 
			    bulletSpeed: opts.bulletSpeed, 
			    // 图标相关
			    icon: resourceHelper.getImage('bluePlaneIcon'),
			    bulletIcon: resourceHelper.getImage('fireIcon'),
			    boomIcon: resourceHelper.getImage('enemyBigBoomIcon')
		    });
	    }
	    

	    //飞机开始射击
	    this.plane.startShoot();

		//更新游戏
		this.update();

	},
	update:function(){
		var self = this;
	    var opts = this.opts;
	    // 更新飞机、敌人
	    this.updateElement();

	    // 先清理画布
	    context.clearRect(0, 0, canvasWidth, canvasHeight);
	    
	    if (this.plane.status === 'boomed') {
	      this.end();
	      return;
	    }
	    
	    // 绘制画布
	    this.draw();
	    
	    // 不断循环 update
	    requestAnimFrame(function() {
	      self.update()
	    });
	},
	/**
    * 更新当前所有元素的状态
    */
  	updateElement: function() {
  		var self =this;
	    var opts = this.opts;
	    var enemySize = opts.enemySize;
	    var enemies = this.enemies;
	    var i = enemies.length;

	    if (this.plane.status === 'booming') {
	      this.plane.booming();
	      return;
	    }
	  
	    // 循环更新
	    while (i--) {
	      var enemy = enemies[i];
	      enemy.down();
	      if (enemy.y >= canvasHeight) {
	        this.enemies.splice(i, 1);
	      } else {
	        // 判断飞机状态
	        if (this.plane.status === 'normal') {
	          if (this.plane.hasCrash(enemy)) {
	            this.plane.booming();
	          }
	        }
	        // 根据敌机状态判断是否被击中
	        switch(enemy.status) {
	          case 'normal':
	            if (this.plane.hasHit(enemy)) {
	              enemy.live -= 1;
	              if (enemy.live === 0) {
	                enemy.booming();
	              }
	            }
	            break;
	          case 'booming':
	            enemy.booming();
	            break;
	          case 'boomed':
	          	if(enemy.enemyscore === opts.smallScore){
	          		this.score += opts.smallScore;
	          	}else if(enemy.enemyscore === opts.bigScore){
	          		this.score += opts.bigScore;
	          	}
	          	
	            enemies.splice(i, 1);
	            break;
	        }
	      }
	    }
	},

	 /**
	 * 绑定手指触摸
	 */
	bindTouchAction: function () {
	  var opts = this.opts;
	  var self = this;
	  // 飞机极限横坐标、纵坐标
	  var planeMinX = 0;
	  var planeMinY = 0;
	  var planeMaxX = canvasWidth - opts.planeSize.width;
	  var planeMaxY = canvasHeight - opts.planeSize.height;
	  // 手指初始位置坐标
	  var startTouchX;
	  var startTouchY;
	  // 飞机初始位置
	  var startPlaneX;
	  var startPlaneY;
	  
	  // 首次触屏
	  $canvas.on('touchstart', function (e) {
	    var plane = self.plane;
	    // 记录首次触摸位置
	    startTouchX = e.touches[0].clientX;
	    startTouchY = e.touches[0].clientY;
	    // console.log('touchstart', startTouchX, startTouchY);
	    // 记录飞机的初始位置
	    startPlaneX = plane.x;
	    startPlaneY = plane.y;
	  
	  });
	  // 滑动屏幕
	  $canvas.on('touchmove', function (e) {
	    var newTouchX = e.touches[0].clientX;
	    var newTouchY = e.touches[0].clientY;
	    // console.log('touchmove', newTouchX, newTouchY);
	      
	    // 新的飞机坐标等于手指滑动的距离加上飞机初始位置
	    var newPlaneX = startPlaneX + newTouchX - startTouchX;
	    var newPlaneY = startPlaneY + newTouchY - startTouchY;
	    // 判断是否超出位置
	    if(newPlaneX < planeMinX){
	      newPlaneX = planeMinX;
	    }
	    if(newPlaneX > planeMaxX){
	      newPlaneX = planeMaxX;
	    }
	    if(newPlaneY < planeMinY){
	      newPlaneY = planeMinY;
	    }
	    if(newPlaneY > planeMaxY){
	      newPlaneY = planeMaxY;
	    }
	    // 更新飞机的位置
	    self.plane.setPosition(newPlaneX, newPlaneY);
	    // 禁止默认事件，防止滚动屏幕
	    e.preventDefault();
	  });
	},


	/**
   	* 生成敌机
   	*/
  	createEnemy: function(enemyType) {
	    var enemies = this.enemies;
	    var opts = this.opts;
	    var images = this.images || {};
	    var enemySize = opts.enemySmallSize;
	    var enemySpeed = opts.enemySpeed;
	    var enemyIcon = resourceHelper.getImage('enemySmallIcon');
	    var enemyBoomIcon = resourceHelper.getImage('enemySmallBoomIcon');
	  
	    var enemyscore = opts.smallScore;
	    var enemyLive = 1; 
	  
	    // 大型敌机参数
	    if (enemyType === 'big') {
	      enemySize = opts.enemyBigSize;
	      enemyIcon = resourceHelper.getImage('enemyBigIcon');
	      enemyBoomIcon = resourceHelper.getImage('enemyBigBoomIcon');
	      enemySpeed = opts.enemySpeed * 0.6;
	      enemyLive = 10;
	      enemyscore = opts.bigScore;
	    } 
	  
	    // 综合元素的参数
	    var initOpt = {
	      x: Math.floor(Math.random() * (canvasWidth - enemySize.width)), 
	      y: -enemySize.height,
	      enemyType: enemyType,
	      live: enemyLive,
	      width: enemySize.width,
	      height: enemySize.height,
	      speed: enemySpeed,
	      icon: enemyIcon,
	      boomIcon: enemyBoomIcon,
	      enemyscore:enemyscore
	    }
	  
	    // 怪兽的数量不大于最大值则新增
	    if (enemies.length < opts.enemyMaxNum) {
	      enemies.push(new Enemy(initOpt));
	    }
	  
	    // console.log(enemies);
	},
  	
	end:function(){
		// alert('游戏结束'+'您的分数：'+this.score);
		$body.attr('data-status','end');
		$("#score").text("您的分数：" + this.score);
	},
	draw:function(){
		this.enemies.forEach(function(enemy) {
	      enemy.draw();
	    });
		this.plane.draw();
	}
};


function init(){
	resourceHelper.load(CONFIG.resources,function() {
		/* Act on the event */
		GAME.init();
		// 绑定手指事件
    	GAME.bindTouchAction();
    	bindEvent();
	});
}
init();