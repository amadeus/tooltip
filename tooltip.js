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
		buttonContent  : '?',
		tooltipContent : 'Tooltip Content',

		buttonTemplate  : 'button',
		tooltipTemplate : 'tooltip',

		activation : 'click',
		injectTo   : 'after',
		autoInject : false,
		shownClass : 'shown'
	},

	shown: false,

	initialize: function(element, options){
		this.element = document.id(element);
		if (!this.element) {
			throw new Error('Tooltip: No valid element specified: ' + element);
		}

		this.setOptions(options);

		this._handleClick = this._handleClick.bind(this);

		this.generateElements();
		this.inject();
	},

	generateElements: function(){
		var opts = this.options;

		// Remove existing elements first
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

		if (opts.activation === 'click' || opts.activation === 'hover') {
			this.trigger = new Element('div', {
				html: getTemplate(opts.buttonTemplate).substitute(opts)
			}).getFirst();
		} else {
			this.trigger = this.element;
		}

		return this;
	},

	attach: function(){
		var opts = this.options;
		if (opts.activation === 'click') {
			this.trigger.addEvent('click', this._handleClick);
			this.tooltip.addEvent('click', this._handleClick);
		}
		if (opts.activation === 'hover') {
			this.trigger.addEvent('mouseenter', this._handleClick);
			this.trigger.addEvent('mouseleave', this._handleClick);
		}
		if (opts.activation === 'focus') {
			this.trigger.addEvent('focus', this._handleClick);
			this.trigger.addEvent('blur',  this._handleClick);
		}
	},

	detach: function(){},

	_handleClick: function(e){
		e.preventDefault();
		this.toggle();
	},

	toggle: function(){
		if (this.shown) {
			this.hide();
		} else {
			this.show();
		}
		return this;
	},

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
