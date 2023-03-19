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

(function () {
	var systeminfo = {

		systeminfo: null,

		lowThreshold : 0.04,

		listenBatteryLowState: function(){
			var self = this;
			try {
				this.systeminfo.addPropertyValueChangeListener(
					'BATTERY',
					function change(battery) {
						if (!battery.isCharging) {
							try {
								tizen.application.getCurrentApplication().exit();
							} catch (ignore) {
							}
						}
					},
					{
						lowThreshold : self.lowThreshold
					},
					onError
				);
			} catch (ignore) { }
		},

		checkBatteryLowState: function(){
			var self = this;
			try {
				this.systeminfo.getPropertyValue(
					'BATTERY',
					function (battery) {
						if (battery.level < self.lowThreshold && !battery.isCharging) {
							try {
								tizen.application.getCurrentApplication().exit();
							} catch (ignore) { }
						}
					},
					null);
			} catch (ignore) { }
		},

		init: function() {
			if (typeof tizen === 'object' && typeof tizen.systeminfo === 'object'){
				this.systeminfo = tizen.systeminfo;
				this.checkBatteryLowState();
				this.listenBatteryLowState();
			} else {
				console.warn('tizen.systeminfo is not available.');
			}
		}
	};

	function onError(error){
		console.warn( "An error occurred: " + error.message );
	}
	systeminfo.init();

}());
