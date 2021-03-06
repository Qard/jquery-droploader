/**
 * Droploader v0.0.1 - 04/25/11
 * 
 * HTML5 File API compatible async upload manager.
 * 
 * 	Droploader is an asynchronous upload manager
 * 	that can handle both drag-and-drop uploads
 * 	and traditional file input button uploads.
 * 	
 * 	For drag-and-drop use $(ele).droploader(config);
 * 	For traditional use $(ele).uploader(config);
 * 	
 * 	Available events are;
 * 		- dragEnter(event)
 * 		- dragLeave(event)
 * 		- dragOver(event)
 * 		- drop(FileList) - Also used as input change event
 * 		- progress(File, percent)
 * 		- error(File, message, URI, line)
 * 		- complete(xhr.responseText)
 * 		- allComplete(FileList)
 * 
 * (c)2011 Stephen Belanger - MIT/GPL.
 * http://docs.jquery.com/License
 */
(function($){
	var methods = {
		/**
		 * Old-school input method.
		 */
		_uploader: function(options) {
			return this.each(function() {
				var self = $(this);
				
				$.each(options, function(label, setting) { self.data(label, setting); });
				
				self.bind('change.uploader', methods._drop('change'));
			});
		},

		/**
		 * Sweet-ass new HTML5 method.
		 */
		_droploader: function(options) {
			return this.each(function() {
				var self = $(this);
        
				$.each(options, function(label, setting) { self.data(label, setting); });
				
				self.bind('dragenter.droploader', methods._stopProp('dragEnter'));
				self.bind('dragleave.droploader', methods._stopProp('dragLeave'));
				self.bind('dragover.droploader', methods._stopProp('dragOver'));
				self.bind('drop.droploader', methods._drop('drop'));
			});
		},
		
		/**
		 * Run callback by event name.
		 */
		_runCallback: function(ctx, name) {
			var func = ctx.data(name), args = [];
			for (var i = 2; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
			if (typeof func === 'function') {
        func.apply(this, args);
      }
		},

		/**
		 * Generic propagation killer.
		 */
		_stopProp: function(name) {
			return function(event) {
				event.stopPropagation(); event.preventDefault();
				
				// Run any callbacks associated with the stopProp'd handler.
				methods._runCallback($(this), name, event);

				return false;
			}
		},

		/**
		 * Drop event handler.
		 */
		_drop: function(mode) {
			return function(event) {
				event.stopPropagation();
				event.preventDefault();
				
				var self = $(this);
				
				// Spin off multi-upload loop so we can return.
				(function(files){
					methods._runCallback(self, 'drop', files);
					
					// Make sure we actually have files in our FileList.
					// Then loop through and upload them all asynchronously.
					if (files.length > 0) {
            $.each(files, function(key, file){
							var xhr = new XMLHttpRequest();
							
							// Setup XHR.
							xhr.open(self.data('method') || 'POST', self.data('url') || document.location.href, true);
							xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
							
							// Add file info to XHR headers.
							xhr.setRequestHeader('X-File-Name', file.name);
							xhr.setRequestHeader('X-File-Type', file.type);
							xhr.setRequestHeader('X-File-Size', file.size);
							
							// It's safest to force octet-stream content-type.
							xhr.setRequestHeader('Content-Type', 'application/octet-stream');
							
							// It's safest to force octet-stream content-type.
							xhr.setRequestHeader('Access-Control-Request-Method', self.data('method') || 'POST');
							xhr.setRequestHeader('Origin', document.location.origin);
							
							// Attach complete listener.
							xhr.addEventListener('load', function(event){
								if (xhr.readyState == 4 && xhr.status == 200) {
                  var json = JSON.parse(xhr.responseText);
                  if (json.error) methods._runCallback(self, 'error', file, json.error);
                  else methods._runCallback(self, 'complete', json);
									if (key === files.length-1) methods._runCallback(self, 'allComplete', files);
								}
							}, false);
							
							// Attach progress listener.
							xhr.addEventListener('progress', function(event){
                methods._runCallback(self, 'progress', file, event.lengthComputable ? ((event.loaded / event.total) * 100) : 0);
							}, false);
							
							// Attach error listener.
							xhr.addEventListener('error', function(message, URI, line){
                methods._runCallback(self, 'error', file, message, URI, line);
							}, false);
							
							// Send file.
							xhr.send(file);
						});
					};
				
				// The FileList location in event changes depending on whether we dropped or changed.
				})(mode == 'drop' ? event.originalEvent.dataTransfer.files : event.currentTarget.files);

				return false;
			}
		}
	};
  
	/**
	 * Old-school input method.
	 */
	$.fn.uploader = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || ! method) {
			return methods._uploader.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.uploader');
		}
	};
	
	/**
	 * Sweet-ass new HTML5 method.
	 */
	$.fn.droploader = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || ! method) {
			return methods._droploader.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.droploader');
		}
	};
})(jQuery);