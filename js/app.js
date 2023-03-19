/*
* Copyright (с) 2016 Evgenii Dobrovidov
* This file is part of "SketchPad".
*
* "SketchPad" is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* "SketchPad" is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with "SketchPad".  If not, see <http://www.gnu.org/licenses/>.
*/

/* Sketch Pad 1.0.2 */
/*STATE*/
var drawing_settings = {
	color: 'febb00',
	width: 20,
	name: null
};
var last_image_number = 1;
var drawn_something = false;
var old_name = null;
var loaded_drawing = false;
var sketch_object = null;
var settings_opened = false;
var screen_size = [360, 480];
var section_changer = null;

function createNewDrawing() {
	drawing_settings.name = null;
	loaded_drawing = false;
	drawn_something = false;
}

function loadDrawing() {
	drawing_settings.name = $(this).parent().attr('data-image');	
	loaded_drawing = true;
	drawn_something = false;
	
	tau.changePage('#drawing');
}

function removeDrawing() {
	var key = $(this).parent().attr('data-image');
	$("#confirm_delete_popup").attr('data-image', key);
	tau.openPopup($("#confirm_delete_popup").get(0));
}

function deleteConfirmationPopupYes() {
	var key = $("#confirm_delete_popup").attr('data-image');
	localStorage.removeItem(key);
	loadSavedImages();
	tau.closePopup();
}

function deleteConfirmationPopupNo() {
	$("#confirm_delete_popup").removeAttr('data-image');
	tau.closePopup();
}

function initMainPage() {
	//attach events
	$("#main #new_drawing_section > a:first").click(createNewDrawing);
	
	$("#delete_popup_yes").click(deleteConfirmationPopupYes);
	$("#delete_popup_no").click(deleteConfirmationPopupNo);
}

function showMainPage() {
	//hack for the god damn sectionchanger, mfing samsung can never make bugless soft
	if (!section_changer) {
		var main_content = $("#main .ui-content").get(0);
		section_changer = new tau.widget.SectionChanger(main_content, {
			circular: false,
			orientation: "horizontal",
			scrollbar: "tab"
		});
	}
	
	//load list of saved images
	loadSavedImages();
}

function hideMainPage() {
	if (section_changer) {
		section_changer.destroy();
		section_changer = null;
	}
}

function loadSavedImages() {
	if (localStorage.length > 3) { //3 items for settings
		$("#load_drawing_section .no-images-message").addClass("hidden");
		$("#load_drawing_section").addClass("no-flex");
		
		$("#load_drawing_section ul").empty();
		for (var i = 0; i < localStorage.length; i++) {
			var key = localStorage.key(i);
			if (key != 'LAST_IMAGE_NUMBER' && key != 'SETTINGS_BRUSH_COLOR' && key != 'SETTINGS_BRUSH_SIZE') {
				var img_name = key;
				if ($("body").hasClass('small-screen')) {
					if ('default_filename' in LANG_STRINGS) {
						img_name = LANG_STRINGS['default_filename'] + img_name;	
					} else {
						img_name = 'Image ' + img_name;
					}
				}
				$("#load_drawing_section ul").append($('<li class="ui-li-has-action-icon" data-image="'+key+'"><div class="ui-action-text">'+img_name+'</div><div class="ui-action-delete"></div></li>'));	
			}
		}
		$("#main #load_drawing_section > ul > li > div.ui-action-text").click(loadDrawing);
		$("#main #load_drawing_section > ul > li > div.ui-action-delete").click(removeDrawing);
		
	} else {
		$("#load_drawing_section .no-images-message").removeClass("hidden");
		$("#load_drawing_section").removeClass("no-flex");
		
		$("#load_drawing_section ul").empty();
	}
}

function showDrawingPage() {
	if (sketch_object === null) {		
		sketch_object = Sketch.create({

	        container: document.getElementById('canvas_container'),
	        autoclear: false,
	        
	        fullscreen: false,
	        width: screen_size[0],
	        height: screen_size[1],
	        
	        touchstart: function () {
	        	drawn_something = true;
	        },

	        touchmove: function() {
	            var touch = this.touches[0];
	            
	            this.lineCap = 'round';
	            this.lineJoin = 'round';
	            this.fillStyle = this.strokeStyle = '#' + drawing_settings.color;
	            this.lineWidth = drawing_settings.width;

	            this.beginPath();
	            this.moveTo(touch.ox, touch.oy);
	            this.lineTo(touch.x, touch.y);
	            this.stroke();
	        }
	    });
		
		if (loaded_drawing) {
			var image = new Image();
			
			var data = localStorage.getItem(drawing_settings.name);
			
			if (data !== null) {
				image.src = data;
				image.onload = function() {
					sketch_object.setup = function () {
						this.drawImage(image, 0, 0);	
					};
				};				
			} else {
				console.error('failed to load image');
			}
		}
	}
}

function saveCurrentImage() {
	//if (drawn_something) {
		var canvas = $("#canvas_container > canvas:first").get(0);
		var data_url = canvas.toDataURL();
		
		var img_name = drawing_settings.name;
		if (!img_name) {
			if ($("body").hasClass('small-screen')) {
				img_name = last_image_number;
			} else {
				if ('default_filename' in LANG_STRINGS) {
					img_name = LANG_STRINGS['default_filename'] + last_image_number;	
				} else {
					img_name = 'Image ' + last_image_number;
				}
			}
		}
		localStorage.setItem(img_name, data_url);
		
		last_image_number++;
		localStorage.setItem('LAST_IMAGE_NUMBER', last_image_number);
	//}
}

function hideDrawingPage() {
	if (!settings_opened) {
		if (drawn_something) {
			saveCurrentImage();
		}
		
		sketch_object.destroy();
		sketch_object = null;	
	}
}

function openSettingsPage() {
	settings_opened = true; //to prevent canvas clearing
	tau.changePage("#draw_settings");	
}

function showSettingsPage() {
	//set parameters for page
	/*if ($("body").hasClass('small-screen')) {
		if (drawing_settings.name) {
			if ('default_filename' in LANG_STRINGS) {
				$("#draw_settings input#settings_image_name").val(drawing_settings.name.replace(LANG_STRINGS['default_filename'], ''));
			} else {
				$("#draw_settings input#settings_image_name").val(drawing_settings.name.replace('Image ', ''));
			}	
		} else {
			$("#draw_settings input#settings_image_name").val(drawing_settings.name);
		}
		
	} else {*/
		$("#draw_settings input#settings_image_name").val(drawing_settings.name);	
	//}
	
	$("#draw_settings .brush-size > .size").removeClass("active");
	$("#draw_settings .brush-size > .size.x" + drawing_settings.width).addClass("active");
	
	$("#draw_settings .brush-color > img").removeClass("active");
	$("#draw_settings .brush-color > img[data-color='" + drawing_settings.color + "']").addClass("active");
}

function hideSettingsPage() {	
	var old_name = null;
	var new_name = $("#draw_settings input#settings_image_name").val();
	if (loaded_drawing && drawing_settings.name != new_name) {
		old_name = drawing_settings.name;
	}
	drawing_settings.name = new_name;
	
	drawing_settings.width = +$("#draw_settings .brush-size > .size.active").attr('data-size');
	
	drawing_settings.color = $("#draw_settings .brush-color > img.active").attr('data-color');
	
	if (old_name) {
		//first - remove image with old name
		localStorage.removeItem(old_name);
		
		//now save with the new one
		saveCurrentImage();
	}
}

function selectBrushSize() {
	$("#draw_settings .brush-size > .size").removeClass("active");
	$(this).addClass("active");
	
	localStorage.setItem('SETTINGS_BRUSH_SIZE', $(this).attr('data-size'));
}

function selectBrushColor() {
	$("#draw_settings .brush-color > img").removeClass("active");
	$(this).addClass("active");
	
	localStorage.setItem('SETTINGS_BRUSH_COLOR', $(this).attr('data-color'));
}

function clearCanvas() {
	if (sketch_object !== null) {
		sketch_object.clear();
		settings_opened = false; //anyway
        tau.back();
	}
}

function gesture(e) {
    if (e.keyName == "back") {
    	var page = $('.ui-page-active').get(0),
    		pageid = page ? page.id : "";
    	
        if (pageid === "main") {
            try {
                tizen.application.getCurrentApplication().exit();
            } catch (ignore) {}
        } else {
        	settings_opened = false; //anyway
            tau.back();
        }
        
    } else if (e.keyName == "menu") {
    	var page = $('.ui-page-active').get(0),
			pageid = page ? page.id : "";
    	
    	if (pageid === "drawing") {
    		openSettingsPage();
    	}
    }	
}

function bindEvents() {
	document.addEventListener('tizenhwkey', gesture);
	
	document.getElementById("main").addEventListener('pagecreate', initMainPage);
	document.getElementById("main").addEventListener('pageshow', showMainPage);
	document.getElementById("main").addEventListener('pagehide', hideMainPage);
	
	document.getElementById("drawing").addEventListener('pagebeforeshow', showDrawingPage);
	document.getElementById("drawing").addEventListener('pagehide', hideDrawingPage);
	
	document.getElementById("draw_settings").addEventListener('pagebeforeshow', showSettingsPage);
	document.getElementById("draw_settings").addEventListener('pagehide', hideSettingsPage);
	
	$("#drawing .flick-up-icon").click(openSettingsPage);
	
	$("#draw_settings .brush-color > img").click(selectBrushColor);
	$("#draw_settings .brush-size > .size").click(selectBrushSize);
	$("#draw_settings #settings_clear_canvas").click(clearCanvas);
}

function localizeUI() {
	var localizable = document.querySelectorAll("[data-localize]");
    if (localizable) {
        for (var i = 0; i < localizable.length; i++) {
            var node = localizable[i],
                str = node.dataset.localize;

            if (str in LANG_STRINGS && node.childNodes) {
                for (var j = 0; j < node.childNodes.length; j++) {
                    var child = node.childNodes[j];
                    if (child.nodeType === 3) {
                        child.nodeValue = LANG_STRINGS[str];
                        break;
                    }
                }
            }
        }
    }
}

if (typeof LANG_CODE === 'undefined' || typeof LANG_STRINGS === 'undefined') {
	//EN
	var LANG_CODE = 'en';
	var LANG_STRINGS = {};
}

localizeUI();

$("body").addClass("lang-" + LANG_CODE);

bindEvents();
tau.defaults.pageTransition = "slideup";

last_image_number = localStorage.getItem('LAST_IMAGE_NUMBER');
if (last_image_number === null) {
	localStorage.setItem('LAST_IMAGE_NUMBER', 1);
	last_image_number = 1;
}

drawing_settings.color = localStorage.getItem('SETTINGS_BRUSH_COLOR');
if (drawing_settings.color === null) {
	drawing_settings.color = 'febb00';
	localStorage.setItem('SETTINGS_BRUSH_COLOR', drawing_settings.color);
}

drawing_settings.width = localStorage.getItem('SETTINGS_BRUSH_SIZE');
if (drawing_settings.width === null) {
	drawing_settings.width = 20;
	localStorage.setItem('SETTINGS_BRUSH_SIZE', drawing_settings.width);
}

tizen.systeminfo.getPropertyValue("DISPLAY", function (screen) {
	var width = screen.resolutionWidth,
		height = screen.resolutionHeight;
	
	if (height <= 320) {
		$("body").addClass("small-screen");
		
		$("#image_title_group").hide();
		$("#image_mark_group").show();
		$("input.big#settings_image_name").remove();
	} else {
		$("input.small#settings_image_name").remove();
	}
	
	screen_size = [width, height];
	$("body .ui-page").width(width).height(height);
});
