'use strict';

(function() {
	var NOT_ALLOWED = 'These characters are not allowed: /?<>:*|":';
	var NO_CONTROL = 'Control characters are not allowed';
	var NO_PERIOD = "Names shouldn't begin with a period";
	var RESERVED = 'Can not use reserved file names like COM0, PRN, etc';
	var NO_ALL_PERIOD = 'Names can not be just periods';
	var REQUIRED = 'Required';

	angular.module('core')
	// fn-filename
	.directive('fnFilename', function () {
		return {
			require: 'ngModel',
			restrict: 'A',
			link: function (scope, element, attributes, ngModel) {
				var extension = attributes.fnExtension; // fn-extension
				var $error;
				if (attributes.fnError) { // fn-error
					var errorId = "#" + attributes.fnError;
					$error = angular.element(document.querySelector(errorId));
				}
				element.on('focus', function () {
					if (extension) {
						var m = element.val();
						m = m.substring(0, m.indexOf(extension) - 1);
						element.val(m);
					}
				});
				element.on('blur', function () {
					if (extension) {
						var m = element.val();
						ngModel.$setViewValue( m + '.' + extension);
					}
				});
				ngModel.$validators.filename = function (modelValue, viewValue) {
					var input = modelValue;
					var errMsg = '';
					if (input) {
						errMsg = validateFilename(input, extension);
					} else {
						errMsg = REQUIRED;
					}
					if ($error) {
						$error.text(errMsg);
					}
					return errMsg === '';
				};
			}
		};

		function validateFilename(input, extension) {
			var illegalRe = /[\/\?<>\\:\*\|":]/g; // basic illegal filename characters
			var controlRe = /[\x00-\x1f\x80-\x9f]/g; // no control characters
			var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
			var leadingRe = /^\.+/; // no names beginning with .
			var reservedRe = /^\.+$/; // no names like ".", ".."
			var result = '';
			if (input.match(illegalRe)) {
				result = NOT_ALLOWED;
			} else if (input.match(controlRe)) {
				result = NO_CONTROL;
			} else if (input.match(leadingRe)) {
				result = NO_PERIOD;
			} else if (!extension && input.match(windowsReservedRe)) {
				result = RESERVED;
			} else if (input.match(reservedRe)) {
				result = NO_ALL_PERIOD;
			}
			return result;
		}
	})
	;
})();
