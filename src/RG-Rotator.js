Object.size = function(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
};

/**
 * Rotator class
 *
 * @Param {DOM} $el : container element
 * @Param {Object} options
 * @Return void
 */
function RGRotator($el, options)
{
	// init private variables
	var self = this;
	var windowEvent = null;
	var transform = null;

	// init public variables
	this.id = '_' + Math.random().toString(36).substr(2, 10);
	this.set = $.extend({}, this.defaults, options);
	this.$self = $el;
	this.$band = this.$self.find(this.set.selector_band);
	this.$panel = this.$self.find(this.set.selector_panel);
	this.count = this.$panel.length;
	this.theta = 0;
	this.hammer = new Hammer(this.$self.get(0), {});
	this.cos = 360 / this.count;
	this.timer = null;

	windowEvent = 'focus.' + this.id + ' blur.' + this.id;


	/**
	 * Initialization
	 *
	 * @Return void
	 */
	var init = function()
	{
		// set class
		self.$self.addClass('rg-rotator');
		self.$band.addClass('rg-rotator-band');
		self.$panel.addClass('rg-rotator-panel');

		// set band css transform
		if (self.set.bandCssTransform)
		{
			// set rotateY
			if (!self.set.bandCssTransform.rotateY)
			{
				self.set.bandCssTransform.rotateY = { value: 0 };
			}
			self.$band.css(transform, getTransformValue(self.set.bandCssTransform));
		}

		// set panel css transform
		for (var i=0; i<self.count; i++)
		{
			self.$panel.eq(i).css(transform, getTransformValue(
				self.set.panelCssTransform,
				{
					rotateY : { value : self.cos * i }
					,translateZ : { value : self.set.panel_interval }
				}
			));
		}
	};

	/**
	 * Touch event
	 * 터치 이벤트 종류에 의하여 다양한 애니메이션 방식을 정할 수 있다.
	 *
	 * @Param {String} type : 이벤트 방식, (value : null,panning), default:null
	 * @Return void
	 */
	var touchEvent = function(type)
	{
		if ('ontouchstart' in window !== true)
		{
			return false;
		}

		switch(type)
		{
			case 'panning':
				self.hammer.get('pan').set({
					direction: Hammer.DIRECTION_HORIZONTAL
				});

				self.hammer.on('panstart panmove panend pancancel', function(e){

					var dis = 0;
					var start = 0;
					var end = 0;

					// touch start
					if (e.type == 'panstart')
					{
						self.$self.removeClass('animate');
						if (self.timer)
						{
							if (self.set.auto)
							{
								self.autoOff();
							}
							self.$band.off();
						}
					}

					// touch end : touch move, not end
					if (e.type == 'panend' || e.type == 'pancancel')
					{
						start = self.theta;
						self.$self.addClass('animate');
						end = self.theta - (e.velocityX * 100);
						end = self.cos * Math.round(end / self.cos);
						dis = start - end;
						if (self.set.auto)
						{
							self.autoOn();
						}
					}
					else
					{
						dis = e.velocityX * self.set.panningSpeed;
					}

					// act
					self.setRotate(dis);
					self.rotateAct(self.theta);

				});
				break;

			default:
				self.hammer.get('swipe').set({
					direction: Hammer.DIRECTION_HORIZONTAL
				});

				self.hammer.get('pan').set({
					direction: Hammer.DIRECTION_HORIZONTAL
				});

				self.hammer.on('swipe', function(e){
					if (e.velocityX > 0)
					{
						self.prev();
					}
					else
					{
						self.next();
					}
				});

				break;
		}
	};

	/**
	 * Get transform value
	 * Array데이터를 transform 값으로 변환시켜서 반환한다.
	 *
	 * @Param {Object} data : 재료가 되는 타입과 값
	 * @Param {Object} data2 : data와 동일한 값이지만 data2값이 data값을 덮어씌운다.
	 * @Return {String} : 'rotateX(30deg) translateX(20px)' 형식으로 출력한다.
	 */
	var getTransformValue = function (data, data2)
	{
		// check data
		if (!data) return false;

		// extend data
		if (data2) {
			data = $.extend({}, data, data2);
		}

		// 속성이름을 근거로 단위를 반환한다.
		function getUnit(type) {
			if (/^rotate/.test(type) || /^skew/.test(type)) {
				return 'deg';
			}
			else if (/^translate/.test(type)) {
				return 'px';
			}
			else {
				return '';
			}
		}

		var str = '';

		for (var key in data) {
			if (key) {
				if (typeof data[key].value === 'number') {
					data[key].unit = (data[key].unit) ? data[key].unit : getUnit(key);
				}
				else {
					data[key].value = data[key].value.toString();
					data[key].unit = '';
				}
				str += (key == 0) ? '' : ' ';
				str += key + '(' + data[key].value + data[key].unit + ')';
			}
		}

		return str;
	};

	/**
	 * Get prefix
	 * 브라우저 prefix를 가져온다.
	 *
	 * @Param {String} attr : css attribute
	 * @Return {String}
	 */
	var getPrefix = function(attr)
	{
		var el = document.createElement("div");
		var prefixes = ["Webkit", "Moz", "O", "ms"];
		var cssAttr = attr.charAt(0).toUpperCase() + attr.slice(1);
		for ( var i=0; i<prefixes.length; i++ )
		{
			if (prefixes[i] + cssAttr in el.style)
			{
				return '-' + prefixes[i].toLowerCase() + '-' + attr;
			}
		}
		return cssAttr in el.style ? attr : null;
	};



	/***********************************
	 * PUBLIC FUNCTION
	 **********************************/

	/**
	 * Set rotate
	 * 회전 목표가 되는값을 계산하고 this.theta값에 저장한다.
	 *
	 * @Param {Number} n : 시작점에서 끝까지의 거리값 (deg)
	 * @Return void
	 */
	this.setRotate = function(n)
	{
		this.theta = this.theta - n;
	};

	/**
	 * Rotate action
	 * css값을 바꾼다.
	 *
	 * @Param {Number} n : 시작점에서 끝까지의 거리값 (deg)
	 * @Return void
	 */
	this.rotateAct = function(n)
	{
		// change band css
		self.set.bandCssTransform.rotateY = { value: n };
		this.$band.css(transform, getTransformValue(self.set.bandCssTransform));
	};

	/**
	 * Prev action
	 * 왼쪽으로 돌리기
	 *
	 * @Return void
	 */
	this.prev = function()
	{
		this.setRotate(this.cos);
		this.rotateAct(this.theta);
	};

	/**
	 * Next action
	 * 오른쪽으로 돌리기
	 *
	 * @Return void
	 */
	this.next = function()
	{
		this.setRotate(0 - this.cos);
		this.rotateAct(this.theta);
	};

	/**
	 * On auto rotate
	 * 자동으로 band를 돌린다.
	 *
	 * @Return void
	 */
	this.autoOn = function()
	{
		//log(self.set.autoDirection);
		this.$self.addClass('auto');
		if (!self.timer)
		{
			self.timer = setInterval(function(){
				self.setRotate( (self.set.autoDirection == 'left') ? self.set.autoSpeed : 0 - self.set.autoSpeed );
				self.rotateAct(self.theta);
			}, 200);
		}
	};

	/**
	 * Off auto rotate
	 * 자동으로 돌아가는 band를 멈춘다.
	 *
	 * @Return void
	 */
	this.autoOff = function()
	{
		clearInterval(self.timer);
		self.timer = null;
	};

	/**
	 * Auto start
	 *
	 * @Param {Boolean} dir : 방향
	 * @Param {Number} speed : 애니메이션 속도
	 * @Return void
	 */
	this.autoStart = function(dir, speed)
	{
		this.set.auto = true;
		this.set.autoSpeed = (speed) ? speed : this.set.autoSpeed;
		this.set.autoDirection = (dir) ? dir : this.set.autoDirection;

		this.autoOn();

		$(window).on(windowEvent, function(e){
			switch(e.type)
			{
				case 'blur':
					self.autoOff();
					break;
				case 'focus':
					self.autoOn();
					break;
			}
		});
	};

	/**
	 * Auto end
	 *
	 * @Return void
	 */
	this.autoEnd = function()
	{
		this.set.auto = false;
		this.autoOff();
		$(window).off(windowEvent);
	};

	/***********************************
	 * ACTION
	 **********************************/

	// set transform
	transform = getPrefix('transform');
	if (transform)
	{
		// init
		init();

		// init touchevent
		touchEvent(this.set.touchType);

		// turn on auto
		if (self.set.auto)
		{
			this.autoOn();
		}
	}

}


// set jQuery plugin
(function($) {
	return $.fn.rgRotator = function(options) {
		return new RGRotator($(this), options).run(true);
	};
})(jQuery);


// set default option
RGRotator.prototype.defaults = {
	touchType : 'basic'
	,panningSpeed : 20
	,bandCssTransform : {}
	,panelCssTransform : {}
	,auto : false
	,autoSpeed : 10
	,autoDirection : 'right'
	,selector_band : '.band'
	,selector_panel : '.band > div'
};
