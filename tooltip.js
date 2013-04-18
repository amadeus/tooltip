(function(global){ 'use strict';

var Templates = {},
	Tooltip, addTemplate, getTemplate;

// Method to easily add a new template.
addTemplate = function addTemplate(name, template){
	if (global.typeOf(template) === 'array')
		template = template.join('');

	Templates[name] = template;

	return Templates;
};

// Method to get a tempalte by name
getTemplate = function getTemplate(name){
	return Templates[name];
};

addTemplate('tooltip', [
	'<div class="tooltip-content">',
		'{content}',
	'</div>'
]);

Tooltip = new Class({

	Implements: [Options, Events],

	options: {
		// Actual content for the Tooltip
		content : 'Tooltip Content',

		// Specified template from Tooltip.Templates
		// New templates must be added via Tooltip.addTemplate prior to class instantiation
		// The 2 listed here are default templates
		template : 'tooltip',

		// Activation type, possible options are [hover, click, focus, null]
		activation : 'click',

		// Injection parameters for the trigger element
		injectTo   : 'after',

		// Hide delay from mouseleave
		eventDelay : 200,

		// Determines whether to auto attach to trigger on instantiation
		autoAttach : true,

		// Class to add after tooltip is show - allows for CSS animations
		shownClass : 'shown'
	},

	shown: false,

	initialize: function(trigger, options){
		this.trigger = document.id(trigger);
		if (!this.trigger) {
			throw new Error('Tooltip: No valid element specified: ' + trigger);
		}

		this.setOptions(options);

		// I prebind all event handlers - these are all technically
		// a private API, thus the underscore
		this._handleToggle = this._handleToggle.bind(this);
		this._handleShow   = this._handleShow.bind(this);
		this._handleHide   = this._handleHide.bind(this);
		this._delayHide    = this._delayHide.bind(this);

		this.generateElements();

		if (this.options.autoAttach)
			this.attach();
	},

	generateElements: function(){
		var opts = this.options;

		// This allows for generateElements to be called safely multiple times
		// Probably unnecessary, but what the heck!
		if (this.tooltip) {
			this.tooltip.destroy();
		}

		// I decided to make the templates string substitution friendly
		// so they can be more customizeable. Therefore I have to substitute vars
		// and allow the browser to do its magical string parsing to do its thang
		this.tooltip = new Element('div', {
			html: getTemplate(opts.template).substitute(opts)
		}).getFirst();

		return this;
	},

	// Add eventListeners based on activation type
	attach: function(){
		var opts = this.options;
		if (this.attached) {
			return this;
		}
		this.attached = true;

		if (opts.activation === 'click') {
			this.trigger.addEvent('click', this._handleToggle);
			this.tooltip.addEvent('click', this._handleToggle);
		}
		if (opts.activation === 'hover') {
			this.trigger.addEvent('mouseenter', this._handleShow);
			this.trigger.addEvent('mouseleave', this._delayHide);
		}
		if (opts.activation === 'focus') {
			this.trigger.addEvent('focus', this._handleShow);
			this.trigger.addEvent('blur',  this._handleHide);
		}

		return this;
	},

	// Remove eventListeners based on activation type
	detach: function(){
		var opts = this.options;
		if (!this.attached) {
			return this;
		}
		this.attached = false;

		if (opts.activation === 'click') {
			this.trigger.removeEvent('click', this._handleToggle);
			this.tooltip.removeEvent('click', this._handleToggle);
		}
		if (opts.activation === 'hover') {
			this.trigger.removeEvent('mouseenter', this._handleShow);
			this.trigger.removeEvent('mouseleave', this._delayHide);
		}
		if (opts.activation === 'focus') {
			this.trigger.removeEvent('focus', this._handleShow);
			this.trigger.removeEvent('blur',  this._handleHide);
		}

		return this;
	},

	// A simple toggle handler for click activation type
	_handleToggle: function(e){
		e.preventDefault();
		this.toggle();
	},

	// A simple handler to force show, used by mouseenter and focus
	_handleShow: function(e){
		e.preventDefault();
		clearTimeout(this._timerHide);
		this.show();
	},

	// A simple handler used by blur
	_handleHide: function(e){
		e.preventDefault();
		this.hide();
	},

	// A simple handler to delay hide from mouseleave
	_delayHide: function(){
		clearTimeout(this._timerHide);
		this._timerHide = this.hide.delay(this.options.eventDelay, this);
	},

	// The `public` API for toggling visibility of the Tooltip
	toggle: function(){
		if (this.shown) {
			this.hide();
		} else {
			this.show();
		}

		return this;
	},

	// Hides the Tooltip, unless it is already hidden
	hide: function(){
		if (!this.shown) {
			return this;
		}
		this.shown = false;

		clearTimeout(this._timerHide);
		this.tooltip
			.dispose()
			.removeClass(this.options.shownClass);

		return this;
	},

	// Shows the Tooltip unless its already show
	show: function(){
		var coords;
		if (this.shown) {
			return this;
		}
		this.shown = true;

		coords = this.trigger.getPosition(document.body);
		this.tooltip
			.setStyles({
				top  : coords.y,
				left : coords.x
			})
			.inject(document.body);

		// Delay the addition of a class to the Tooltip for better CSS Transition support
		clearTimeout(this._timerShow);
		this._timerShow = (function(){
			this.tooltip.addClass(this.options.shownClass);
		}).delay(1, this);

		return this;
	},

	// Removes the Tooltip and detaches, keeps elements
	dispose: function(){
		this.detach();
		this.tooltip.dispose();

		return this;
	}

});

Tooltip.extend({
	addTemplate : addTemplate,
	getTemplate : getTemplate,
	Templates   : Templates
});

global.Tooltip = Tooltip;

})(window);
