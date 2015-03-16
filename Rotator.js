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
function Rotator($el, options)
{
	// init private variables
	var self = this;

	// init public variables
	this.set = $.extend({}, this.defaults, options);
	this.$self = $el;
	this.$band = this.$self.find(this.set.selector_band);
	this.$figure = this.$self.find(this.set.selector_panel);
	this.count = this.$figure.length;
	this.theta = 0;
	this.hammer = new Hammer(this.$self.get(0), {});
	this.cos = 360 / this.count;
	this.timer = null;


	/**
	 * Initialization CSS
	 * css 초기화
	 *
	 * @Return void
	 */
	var initCss = function()
	{
		self.$self.addClass('rg-rotator');
		self.$band.addClass('rg-rotator-band');
		self.$figure.addClass('rg-rotator-panel');

		if (self.set.bandCssTransform)
		{
			self.$band.css('transform', getTransformValue(self.set.bandCssTransform));
		}

		for (var i=0; i<self.count; i++)
		{
			self.$figure.eq(i).css('transform', getTransformValue({
				rotateY : { value : self.cos * i }
				,translateZ : { value : self.set.panel_interval }
			}));
		}
	}

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

					var dis = start = end = 0;
					var transitionEnd = null;

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
						end = self.cos * Math.ceil(end / self.cos);
						dis = start - end;
						if (self.set.auto)
						{
							self.autoOn();
						}
					}
					else
					{
						dis = e.velocityX * 6;
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
	}

	/**
	 * Get transform value
	 * Array데이터를 transform 값으로 변환시켜서 반환한다.
	 *
	 * @Param {Array} data : 재료가 되는 타입과 값
	 * @Return {String} : 'rotateX(30deg) translateX(20px)' 형식으로 출력한다.
	 */
	var getTransformValue = function(data)
	{
		// check data
		if (!data) return false;
		if (!Object.size(data)) return false;

		// 속성이름을 근거로 단위를 반환한다.
		function getUnit(type)
		{
			if (/^rotate/.test(type) || /^skew/.test(type))
			{
				return 'deg';
			}
			else if (/^translate/.test(type))
			{
				return 'px';
			}
			else
			{
				return '';
			}
		}

		var str = '';

		for (var i in data)
		{
			if (i)
			{
				if (typeof data[i].value === 'number')
				{
					data[i].value = data[i].value;
					data[i].unit = (data[i].unit) ? data[i].unit : getUnit(i);
				}
				else
				{
					data[i].value = data[i].value.toString();
					data[i].unit = '';
				}
				str += (i == 0) ? '' : ' ';
				str += i + '(' + data[i].value + data[i].unit + ')';
			}
		}

		return str;
	}


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
		var start = this.theta;
		var end = this.theta - n;
		var distance = start - end;

		this.theta = end;
	}

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
		this.$band.css('transform', getTransformValue(self.set.bandCssTransform));
	}

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
	}

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
	}

	/**
	 * On auto rotate
	 * 자동으로 band를 돌린다.
	 *
	 * @Param {Boolean} dir : 돌아가는 방향 (true:왼쪽, false:오른쪽)
	 * @Return void
	 */
	this.autoOn = function(dir)
	{
		this.$self.addClass('auto');

		if (!self.timer)
		{
			self.timer = setInterval(function(){
				self.setRotate( (dir) ? self.set.autoSpeed : 0 - self.set.autoSpeed );
				self.rotateAct(self.theta);
			}, 200);
		}
	}

	/**
	 * Off auto rotate
	 * 자동으로 돌아가는 band를 멈춘다.
	 *
	 * @Return void
	 */
	// auto off
	this.autoOff = function()
	{
		clearInterval(self.timer);
		self.timer = null;
	}


	/***********************************
	 * ACTION
	 **********************************/

	touchEvent(this.set.touchType);
	initCss();

	if (self.set.auto)
	{
		this.autoOn();
	}

}


// set default option
Rotator.prototype.defaults = {
	touchType : 'basic'
	,bandCssTransform : {}
	,autoSpeed : 10
	,auto : false
	,selector_band : '.band'
	,selector_panel : '.band > div'
}