'use strict';
angular.module('documents')
	.directive('documentMgrEdit', ['$rootScope', '$modal', '$log', '_', 'moment', 'DocumentMgrService', 'TreeModel', 'CodeLists', function ($rootScope, $modal, $log, _, moment, DocumentMgrService, TreeModel, CodeLists) {
		return {
			restrict: 'A',
			scope: {
				project: '=',
				doc: '=',
				onUpdate: '='
			},
			link: function (scope, element, attrs) {
				element.on('click', function () {
					$modal.open({
						animation: true,
						templateUrl: 'modules/documents/client/views/document-manager-edit.html',
						resolve: {
							obj: function(Document, FolderModel) {
								if (scope.doc._schemaName === "Document") {
									return Document.getModel(scope.doc._id);
								} else {
									return FolderModel.lookup(scope.project._id, scope.doc.model.id);
								}
							}
						},
						controllerAs: 'editFileProperties',
						controller: function ($scope, $modalInstance, DocumentMgrService, TreeModel, ProjectModel, Document, obj, CodeLists, FolderModel, AlertService) {
							var self = this;
							self.busy = true;

							$scope.project = scope.project;
							$scope.inspectionReportFollowupTypes = CodeLists.inspectionReportFollowUpTypes.active;

							$scope.dateOptions = {
								showWeeks: false
							};

							$scope.originalName = obj.displayName;
							$scope.doc = obj;
							// any dates going to the datepicker need to be javascript Date objects...
							$scope.doc.documentDate = _.isEmpty(obj.documentDate) ? null : moment(obj.documentDate).toDate();
							$scope.datePicker = {
								opened: false
							};
							// Used to remove keywords from the document model
							$scope.removeKeyword = function (keyword) {
								_.remove($scope.doc.keywords, function (word) {
									return word === keyword;
								});
							};
							$scope.dateOpen = function() {
								$scope.datePicker.opened = true;
							};
							$scope.doc.dateUploaded = _.isEmpty(obj.dateUploaded) ? moment.now() : moment(obj.dateUploaded).toDate();
							$scope.dateUploadedPicker = {
								opened: false
							};
							$scope.dateUploadedOpen = function() {
								$scope.dateUploadedPicker.opened = true;
							};
							// add non-required inspection report date. Need to convert string date to date for form validation, even though the field is not required
							if ($scope.doc.inspectionReport) {
								$scope.doc.inspectionReport.dateReportIssued = _.isEmpty(obj.inspectionReport.dateReportIssued) ? null : moment(obj.inspectionReport.dateReportIssued).toDate();
							}
							$scope.dateReportIssuedPicker = {
								opened: false
							};
							$scope.dateReportIssuedOpen = function() {
								$scope.dateReportIssuedPicker.opened = true;
							};

							$scope.validate = function() {
								$scope.$broadcast('show-errors-check-validity', 'editFileForm');
							};

							self.canEdit = $scope.doc.userCan.write;

							self.cancel = function () {
								$modalInstance.dismiss('cancel');
							};

							self.save = function (isValid) {
								self.busy = true;
								// should be valid here...
								if (isValid) {
									if ($scope.doc._schemaName === "Document") {
										Document.save($scope.doc)
										.then(function (result) {
											// somewhere here we need to tell document manager to refresh it's document...
											if (scope.onUpdate) {
												scope.onUpdate(result);
											}
											self.busy = false;
											$modalInstance.close(result);
										}, function(error) {
											console.log(error);
											self.busy = false;
										});
									} else {
										// Check if the foldername already exists.
										FolderModel.lookupForProjectIn($scope.project._id, $scope.doc.parentID)
										.then(function (fs) {
											if ($scope.originalName === $scope.doc.displayName) {
												// Skip if we detect the user didn't change the name.
												return FolderModel.save($scope.doc);
											} else {
												var found = null;
												_.each(fs, function (foldersInDirectory) {
													if (foldersInDirectory.displayName === $scope.doc.displayName) {
														found = true;
														return false;
													}
												});
												if (found) {
													return null;
												} else {
													return FolderModel.save($scope.doc);
												}
											}
										})
										.then(function (result) {
											if (result) {
												// somewhere here we need to tell document manager to refresh it's document...
												if (scope.onUpdate) {
													scope.onUpdate(result);
												}
												self.busy = false;
												$modalInstance.close(result);
											} else {
												self.busy = false;
												AlertService.error("Sorry, folder already exists.  Please choose another name.");
											}
										}, function(error) {
											console.log(error);
											self.busy = false;
										});
									}
								}
							};
							self.busy = false;
						}
					});
				});
			}
		};
	}])
;
