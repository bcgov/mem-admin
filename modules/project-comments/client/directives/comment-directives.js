'use strict';
// =========================================================================
//
// Directives to do with comments either public or working group
//
// =========================================================================
angular.module ('comment')
// -------------------------------------------------------------------------
//
// list of public comments from the point of view of the public
//
// -------------------------------------------------------------------------
.directive ('tmplPublicCommentList', function ($modal, _) {
	return {
		scope: {
			period  : '=',
			project : '='
		},
		restrict: 'E',
		templateUrl : 'modules/project-comments/client/views/public-comments/list.html',
		controllerAs: 's',
		controller: function ($rootScope, $scope, NgTableParams, Authentication, CommentModel) {
			var s       = this;
			var project = s.project = $scope.project;
			var period  = s.period  = $scope.period;

			var currentFilter;

			$scope.$on('NEW_PUBLIC_COMMENT_ADDED', function (e, data) {
				console.log('comment: ' + data.comment);
				s.refreshEao();
			});

			// -------------------------------------------------------------------------
			//
			// these toggle things (the tab groups and filters)
			//
			// -------------------------------------------------------------------------
			s.toggle = function (v) {
				currentFilter = {eaoStatus:v};
				if (v === 'Classified' || v === 'Unclassified') currentFilter = {proponentStatus:v};
				angular.extend(s.tableParams.filter(), currentFilter);
			};
			s.toggleP = function (v) {
				currentFilter = {proponentStatus:v};
				angular.extend(s.tableParams.filter(), currentFilter);
			};
			// -------------------------------------------------------------------------
			//
			// refresh eao data, this is pretty much everything
			//
			// -------------------------------------------------------------------------
			s.refreshEao = function () {
				CommentModel.getEAOCommentsForPeriod ($scope.period._id).then (function (result) {
					s.totalPending  = result.totalPending;
					s.totalDeferred = result.totalDeferred;
					s.totalPublic   = result.totalPublic;
					s.totalRejected = result.totalRejected;
					s.totalAssigned   = result.totalAssigned;
					s.totalUnassigned = result.totalUnassigned;
					s.tableParams   = new NgTableParams ({count:10, filter:currentFilter}, {dataset:result.data});
					$scope.$apply ();
				});
			};
			// -------------------------------------------------------------------------
			//
			// refresh only public data
			//
			// -------------------------------------------------------------------------
			s.refreshPublic = function () {
				CommentModel.getCommentsForPeriod ($scope.period._id).then (function (collection) {
					s.tableParams = new NgTableParams ({count:50}, {dataset:collection});
					$scope.$apply ();
				});
			};
			// -------------------------------------------------------------------------
			//
			// refresh only classification data
			//
			// -------------------------------------------------------------------------
			s.refreshProponent = function () {
				CommentModel.getProponentCommentsForPeriod ($scope.period._id).then (function (result) {
					s.totalAssigned   = result.totalAssigned;
					s.totalUnassigned = result.totalUnassigned;
					s.tableParams     = new NgTableParams ({count:50, filter:currentFilter}, {dataset:result.data});
					$scope.$apply ();
				});
			};
			// -------------------------------------------------------------------------
			//
			// if the user clicks a row, open the detail modal
			//
			// -------------------------------------------------------------------------
			s.detail = function (comment) {
				var old = {
					status  : comment.eaoStatus,
					pStatus : comment.proponentStatus,
					topics  : comment.topics.map (function (e) { return e; }),
					vcs     : comment.valuedComponents.map (function (e) { return e; }),
					pillars : comment.pillars.map (function (e) { return e; }),
					notes   : comment.eaoNotes,
					rnotes  : comment.rejectedNotes,
					rreas   : comment.rejectedReason
				};
				$modal.open ({
					animation: true,
					templateUrl: 'modules/project-comments/client/views/public-comments/detail.html',
					controllerAs: 's',
					size: 'lg',
					windowClass: 'public-comment-modal',
					controller: function ($scope, $modalInstance) {
						$scope.period      = period;
						$scope.project     = project;
						$scope.comment     = comment;
						$scope.cancel      = function () { $modalInstance.dismiss ('cancel'); };
						$scope.ok          = function () { $modalInstance.close (comment); };
						$scope.pillars     = comment.pillars.map (function (e) { return e; });
						$scope.vcs         = comment.valuedComponents.map (function (e) { return e; });
					}
				})
				.result.then (function (data) {
					console.log ('result:', data);
					data.proponentStatus = (data.pillars.length > 0) ? 'Classified' : 'Unclassified';
					CommentModel.save (data)
					.then (function (result) {
						if (period.userCan.vetComments) {
							s.refreshEao ();
						}
						else if (period.userCan.classifyComments) {
							s.refreshProponent ();
						}
					});
				})
				.catch (function (err) {});
			};
			if (period.userCan.vetComments) {
				currentFilter = {eaoStatus:'Unvetted'};
				s.refreshEao ();
			}
			else if (period.userCan.classifyComments) {
				currentFilter = {proponentStatus:'Unclassified'};
				s.refreshProponent ();
			}
			else {
				s.refreshPublic ();
			}
		}
	};
})
// -------------------------------------------------------------------------
//
// add a public comment
//
// -------------------------------------------------------------------------
.directive ('addPublicComment', function ($modal, CommentModel) {
	return {
		restrict: 'A',
		scope: {
			project: '=',
			period : '='
		},
		link : function(scope, element, attrs) {
			element.on('click', function () {
				$modal.open ({
					animation: true,
					templateUrl: 'modules/project-comments/client/views/public-comments/add.html',
					controllerAs: 's',
					size: 'lg',
					windowClass: 'public-comment-modal',
					resolve: {
						comment: function (CommentModel) {
							return CommentModel.getNew ();
						}
					},
					controller: function ($rootScope, $scope, $modalInstance, comment) {
						var s     = this;
						s.step    = 1;
						s.comment = comment;
						comment.period = scope.period;
						comment.project = scope.project;
						comment.makeVisible = false;
						s.cancel  = function () { $modalInstance.dismiss ('cancel'); };
						s.next    = function () { s.step++; };
						s.ok      = function () { $modalInstance.close (s.comment); };
						s.submit  = function () {
							comment.isAnonymous = !comment.makeVisible;
							CommentModel.add (s.comment)
							.then (function (comment) {
								s.step = 3;
								$scope.$apply ();
								$rootScope.$broadcast('NEW_PUBLIC_COMMENT_ADDED', {comment: comment});
							})
							.catch (function (err) {
								s.step = 4;
								$scope.$apply ();
							});
						};
					}
				})
				.result.then (function (data) {
				})
				.catch (function (err) {});
			});
		}
	};
})
// -------------------------------------------------------------------------
//
// add an open house thingamabob
//
// -------------------------------------------------------------------------
.directive ('editOpenHouse', function ($modal) {
	return {
		restrict: 'A',
		scope: {
			period : '=',
			openhouse : '=',
			mode   : '@',
			index  : '='
		},
		link : function(scope, element, attrs) {
			element.on('click', function () {
				if (scope.mode === 'delete') {
					scope.period.openHouses.splice (scope.index, 1);
					scope.$apply();
				}
				else {
					$modal.open ({
						animation: true,
						templateUrl: 'modules/project-comments/client/views/public-comments/open-house-edit.html',
						controllerAs: 's',
						size: 'md',
						windowClass: 'public-comment-modal',
						controller: function ($scope, $modalInstance) {
							var s     = this;
							s.period = scope.period;
							s.project = scope.project;
							s.openHouse = scope.openhouse;
							console.log ('openHouse = ', scope.openhouse);
							if (scope.mode === 'add') {
								s.openHouse = {
									eventDate   : new Date (),
									description : ''
								};
							}
							s.cancel  = function () { $modalInstance.dismiss ('cancel'); };
							s.ok      = function () {
								if (scope.mode === 'add') {
									scope.period.openHouses.push (s.openHouse);
								}
								$modalInstance.close ();
							};
						}
					})
					.result.then (function (data) {
					})
					.catch (function (err) {});
				}
			});
		}
	};
})

;
//
// CC: pretty sure these are not used anymore
//
// // -------------------------------------------------------------------------
// //
// // Comment Period List for a given project
// //
// // -------------------------------------------------------------------------
// .directive ('tmplCommentPeriodList', function () {
// 	return {
// 		restrict: 'E',
// 		templateUrl: 'modules/project-comments/client/views/period-list.html',
// 		controller: 'controllerCommentPeriodList',
// 		controllerAs: 'plist'
// 	};
// })
// .directive ('editPeriodModal', ['$modal', function ($modal) {
// 	return {
// 		restrict: 'A',
// 		scope: {
// 			project: '=',
// 			period: '='
// 		},
// 		link : function (scope, element, attrs) {
// 			// console.log('my modal is running');
// 			element.on ('click', function () {
// 				var modalView = $modal.open ({
// 					animation: true,
// 					templateUrl: 'modules/project-comments/client/views/period-edit.html',
// 					controller: 'controllerEditPeriodModal',
// 					controllerAs: 'p',
// 					scope: scope,
// 					size: 'lg',
// 					resolve: {
// 						rProject: function() { return scope.project; },
// 						rPeriod: function() { return scope.period; }
// 					}
// 				});
// 				modalView.result.then(function () {}, function () {});
// 			});
// 		}

// 	};
// }]

