/**
 * Crop image from input and append to FormData
 * @requires jQuery
 * @requires Bootsrap 3
 * @requires Jcrop
 */
(function (factory) {
	'use strict';
	if (typeof define === 'function' && define.amd) {
		define(['jquery', 'bootstrap', 'jcrop'], factory);
	} else {
		factory(jQuery);
	}

}(function ($) {
	'use strict';

	var BASE64_MARKER = ';base64,';

	var template = ['<div class="modal fade" id="jCropModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">',
						'<div class="modal-dialog">',
							'<div class="modal-content">',
								'<div class="modal-header">',
								'   <h4 class="modal-title">Crop Image</h4>',
								'</div>',
								'<div class="modal-body"></div>',
								'<div class="modal-footer">',
									'<button type="button" class="btn btn-primary"></button>',
								'</div>',
							'</div>',
						'</div>',
					'</div>'].join('\n');

	var jCropModalElement;
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext("2d");

	function isArray(obj){
		return Object.prototype.toString.call(obj) === '[object Array]';
	}

	function Size(img, options){
		if(options.width && options.height){
			return {
				width: options.width,
				height: options.height
			}
		} else if(options.width){
			return {
				width: options.width,
				height: Math.round(options.width * img.height / img.width)
			}
		} else if(options.height) {
			return {
				width: Math.round(options.height * img.width / img.height),
				height: options.height
			}
		} else {
			return {
				width: img.width,
				height: img.height
			}
		}
	}

	function Width(img){

		// Mini patch
		return img.width + 50;
		
		if(img.width > window.innerWidth - 50){
			img.height = Math.round((window.innerWidth * img.height) / img.width);
			img.width = window.innerWidth - 100;
			return window.innerWidth - 50;
		} else {
			return img.width + 50;
		}
	}

	function Modal(){
		if(!jCropModalElement){
			$('body').append(template);
			jCropModalElement = $('#jCropModal');
		}

		$('.modal-body', jCropModalElement).empty();
		return jCropModalElement;
	}

	function Change(target, options){

		var cropData,
			saveData = [],
			jCropApi,
			fileName = target.files[0].name,
			current = 0,
			reader = new FileReader();

		function changeCoords(c){
			cropData = c;
		}

		function jCropAppend(img, params){
			var jCropOptions = {
				onChange:   changeCoords,
				onSelect:   changeCoords,
				setSelect: [0, 0, img.width, img.height]
			};

			if(params[0].width && params[0].height){
				jCropOptions.aspectRatio =  params[0].width / params[0].height;
			} else if(params[0].width){
				jCropOptions.minSize = [params[0].width, 0];
				//jCropOptions.aspectRatio =  params[0].width / Math.round(params[0].width * img.height / img.width)
			} else if(params[0].height) {
				jCropOptions.minSize = [0, params[0].height];
				//jCropOptions.aspectRatio =  Math.round(params[0].height * img.width / img.height) / params[0].height
			}

			if(jCropApi)
				jCropApi.destroy();

			$(img).Jcrop(jCropOptions, function(){
				jCropApi = this;
			});
		}

		function Crop(img, params){

			var size = (params.width && params.height) ? Size(img, params) : Size({width: cropData.w, height: cropData.h}, params);

			canvas.width = size.width;
			canvas.height = size.height;
			ctx.drawImage(img,  cropData.x, cropData.y, cropData.w, cropData.h, 0, 0, size.width, size.height);

			return canvas.toDataURL('image/jpeg');
		}

		reader.onloadend = function(e){
			$('<img/>').on('load', function(){
				var img = this,
					modal = Modal();

				modal.find('.modal-body').append(img);
				modal.find('.modal-dialog').width(Width(img));
				modal.find('.btn.btn-primary').off('click.jCropModal').on('click.jCropModal', function(e){

					var opt;
					for(var i = 0; i < options.params[current].length; i++){

						opt = options.params[current][i];

						saveData.push({
							fileName: fileName,
							name: opt.name,
							dataUrl: Crop(img, opt)
						});
					}

					if(options.multiCrop && current == options.params.length - 2){
						$(this).text('Save');
					}

					if(current < options.params.length - 1){
						jCropAppend(img, options.params[current]);
					} else {
						$(target).data('jCropSendData', saveData);
						modal.modal('hide');
					}

					current++;

					if(current < options.params.length)
						modal.find('.modal-title').text(options.params[current][0].title || 'Crop Image');

				}).text(options.multiCrop ? 'Next' : 'Save');

				jCropAppend(img, options.params[current]);
				modal.find('.modal-title').text(options.params[current][0].title || 'Crop Image');
				modal.modal('show');
			}).attr('src', reader.result);
		}
		reader.readAsDataURL(target.files[0]);
	}

	function FormatOptions(name, params){
		var i, j, tmp;
		var options = {
			multiCrop: (params.length > 1),
			params: []
		};


		if(params.length > 0) {
			for(i = 0; i < params.length; i++){
				if(!isArray(params[i])){
					tmp = [params[i]];
				} else {
					tmp = params[i];
				}

				if(tmp.length > 1) {
					var tmp_name;
					for(j = 0; j < tmp.length; j++){
						if(tmp[j].name){
							tmp_name = tmp[j].name;
						} else if(tmp[j].key){
							tmp_name = name + '[' + tmp[j].key + ']';
						} else if(tmp[j].width && tmp[j].height) {
							tmp_name = name + '[' + tmp[j].width + 'x' + tmp[j].height + ']';
						} else {
							tmp_name = name + '[]';
						}

						tmp[j].name = tmp_name;
					}


				} else {
					var tmp_name;
					if(tmp[0].name){
						tmp_name = tmp[0].name;
					} else if(tmp[0].key){
						tmp_name = name + '[' + tmp[0].key + ']';
					} else {
						tmp_name = name;
					}

					tmp[0].name = tmp_name;
				}

				options.params.push(tmp);
			}
		} else {
			options.params.push([{
				name: name
			}]);
		}

		return options;
	}

	function dataURItoBlob(dataURL) {
		if (dataURL.indexOf(BASE64_MARKER) == -1) {
			var parts = dataURL.split(',');
			var contentType = parts[0].split(':')[1];
			var raw = parts[1];

			return new Blob([raw], {type: contentType});
		}

		var parts = dataURL.split(BASE64_MARKER);
		var contentType = parts[0].split(':')[1];
		var raw = window.atob(parts[1]);
		var rawLength = raw.length;

		var uInt8Array = new Uint8Array(rawLength);

		for (var i = 0; i < rawLength; ++i) {
			uInt8Array[i] = raw.charCodeAt(i);
		}

		return new Blob([uInt8Array], {type: contentType});
	}

	if(!$.fn.Jcrop || !$.fn.modal){
		throw Error('Jcrop or Bootsrap modal is not defined');
	} else if(window.File && window.FileReader && window.FileList && window.Blob){

		$.fn.jCropModal = function(){
			var options = Array.prototype.slice.call(arguments);
			this.filter('input[type=file]').each(function(){
				$(this).data('jCropDataOptions', FormatOptions(this.name, options)).on('change', function(e){
					var target = e.target;
					if(target.files.length == 1 && target.files[0].type.match('image.*')){
						Change(target, $(target).data('jCropDataOptions'));
					}
				});
			});

			return this;
		}

		$.fn.jCropExists = function(){
			return !!this.data('jCropSendData');
		}

		$.fn.jCropAppendFormData = function(formData){
			var saveData;
			this.filter('input[type=file]').each(function(){
				var self = $(this);
				if(self.data('jCropModalSaveOrigin') && this.files.length == 1){
					formData.append(this.name + '[origin]', this.files[0], this.files[0].name);
				}

				if(saveData = self.data('jCropSendData')){
					for(var i = 0; i < saveData.length; i++){
						formData.append(saveData[i].name, dataURItoBlob(saveData[i].dataUrl), saveData[i].fileName);
					}
				}
			});

			return this;
		}

	} else {
		throw Error('FileReader is not defined');
	}
}));