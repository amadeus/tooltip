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

// Add default templates
addTemplate('button', [
	'<div class="tooltip-button">',
		'{buttonContent}',
	'</div>'
]);

addTemplate('tooltip', [
	'<div class="tooltip-content">',
		'{tooltipContent}',
	'</div>'
]);

Tooltip = new Class({

	Implements: [Options, Events],

	options: {
		// Content use for the button, I may deprecate the button completely
		buttonContent  : '?',

		// Actual content for the Tooltip
		tooltipContent : 'Tooltip Content',

		// Specified template from Tooltip.Templates
		// New templates must be added via Tooltip.addTemplate prior to class instantiation
		// The 2 listed here are default templates
		buttonTemplate  : 'button',
		tooltipTemplate : 'tooltip',

		// Activation type, possible options are [hover, click, focus]
		activation : 'click',
		// Injection parameters for the trigger element
		injectTo   : 'after',
		// Hide delay from mouseleave
		eventDelay : 200,
		// Determines whether to autoinject on Tooltip instantiation
		autoInject : true,
		// Class to add after tooltip is show - allows for CSS animations
		shownClass : 'shown'
	},

	shown: false,

	initialize: function(element, options){
		this.element = document.id(element);
		if (!this.element) {
			throw new Error('Tooltip: No valid element specified: ' + element);
		}

		this.setOptions(options);

		// I prebind all event handlers - these are all technically
		// a private API, thus the underscore
		this._handleToggle = this._handleToggle.bind(this);
		this._handleShow   = this._handleShow.bind(this);
		this._handleHide   = this._handleHide.bind(this);
		this._delayHide    = this._delayHide.bind(this);

		this.generateElements();

		if (this.options.autoInject)
			this.inject();
	},

	generateElements: function(){
		var opts = this.options;

		// This allows for generateElements to be called safely multiple times
		// Probably unnecessary, but what the heck!
		if (this.trigger && opts.activation !== 'focus') {
			this.trigger.destroy();
		}
		if (this.tooltip) {
			this.tooltip.destroy();
		}

		// I decided to make the templates string substitution friendly
		// so they can be more customizeable. Therefore I have to substitute vars
		// and allow the browser to do its magical string parsing to do its thang
		this.tooltip = new Element('div', {
			html: getTemplate(opts.tooltipTemplate).substitute(opts)
		}).getFirst();

		// If focus is the activation type, we use the element as the trigger,
		// otherewise we create a trigger button
		if (opts.activation === 'focus') {
			this.trigger = this.element;
		} else {
			this.trigger = new Element('div', {
				html: getTemplate(opts.buttonTemplate).substitute(opts)
			}).getFirst();
		}

		return this;
	},

	// Add eventListeners based on activation type
	attach: function(){
		var opts = this.options;
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
		clearTimeout(this.timer);
		this.show();
	},

	// A simple handler used by blur
	_handleHide: function(e){
		e.preventDefault();
		this.hide();
	},

	// A simple handler to delay hide from mouseleave
	_delayHide: function(){
		clearTimeout(this.timer);
		this.timer = this.hide.delay(this.options.eventDelay, this);
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
		clearTimeout(this.timer);
		this.tooltip
			.removeClass(this.options.shownClass)
			.dispose();

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

		this.timer = (function(){
			this.tooltip.addClass(this.options.shownClass);
		}).delay(1, this);

		return this;
	},

	// Injects the Tooltip based on the element passed in
	inject: function(){
		if (this.injected) {
			return this;
		}

		this.injected = true;
		this.attach();
		if (this.options.activation !== 'focus') {
			this.trigger.inject(this.element, this.options.injectTo);
		}

		return this;
	},

	// Removes the Tooltip, but keeps a reference to the elements for re-injection
	dispose: function(){
		if (!this.injected) {
			return this;
		}

		this.injected = false;
		this.detach();
		if (this.options.activation !== 'focus') {
			this.trigger.dispose();
		}
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
