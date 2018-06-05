'use strict';

var path = require ('path');
var routes = require('../../../core/server/controllers/core.routes.controller');
var policy = require('../../../core/server/controllers/core.policy.controller');
var DocumentController = require (path.resolve('./modules/documents/server/controllers/core.document.controller'));
var ProjectController = require (path.resolve('./modules/projects/server/controllers/project.controller'));
var _ = require ('lodash');

module.exports = function (app) {

  app.route('/api/search')
    .all(policy('guest'))
    .get (function (req, res) {
      routes.setSessionContext(req)
        .then( function (opts) {
        // console.log("req:", JSON.stringify(req.query));
          if (req.query.types === 'document') {
            var docController = new DocumentController(opts);
            var page = 0;
            var limit = 15;
            var results = [];
            var projects = null;
            var p = new ProjectController(opts);
            var projectQuery = {};
            // Project Filtering (objectID's are coming in).
            if (req.query.project) {
              projects = req.query.project.split(',');
              projectQuery = _.extend (projectQuery, { "_id": {$in : projects}});
            // console.log("project query:", projectQuery);
            }
            if (req.query.projectcode) {
              var codes = req.query.projectcode.split(',');
              projectQuery = _.extend (projectQuery, { "code": {$in : codes}});
            // console.log("project query:", projectQuery);
            }
            // operator filtering (objectID's are coming in)
            if (req.query.proponent) {
              var ops = req.query.proponent.split(',');
              projectQuery = _.extend (projectQuery, { "proponent": {$in : ops}});
            // console.log("organization query:", projectQuery);
            }
            // owner filtering (objectID's are coming in)
            if (req.query.ownership) {
              var ownershipArray = req.query.ownership.split(',');
              projectQuery = _.extend (projectQuery, { "ownershipData": { $elemMatch: { organization: { $in: ownershipArray }} }});
            // console.log("ownership query:", projectQuery);
            }
            if (req.query.page) {
              page = parseInt(req.query.page, 10);
            }
            if (req.query.limit) {
              limit = parseInt(req.query.limit, 10);
            }
            // We're filtering our searches on project and orgs
            return p.findMany(projectQuery,"_id type name code ownership proponent")
              .then(function (pdata) {
                // console.log("projects:", pdata.length);
                projects = pdata;
                if (projects && projects.length > 0) {
                  // This ensures we don't find docs that are in other projects not part
                  // of the codes lookup if no objectID's are specified.
                  var prjString = "";
                  _.each(projects, function (pp) {
                    prjString += pp._id + ",";
                  });
                  if (prjString) {
                    prjString = prjString.replace(/,*$/, "");
                  }
                  var pjs = prjString ||req.query.project;

                  return docController.searchMany(req.query.search,
                    req.query.datestart,
                    req.query.dateend,
                    pjs,
                    null, // not on this one - we already filtered on the org
                    null, // not on this one - we already filtered on the ownership
                    req.query.fields,
                    null, // sort by
                    page,
                    limit);

                } else {
                  return [];
                }
              })
              .then(function(docs) {
                _.each(docs, function(doc) {
                  results.push(doc);
                });
                // console.log("docs", docs.length);
                return results;
              })
              .then(function () {
                // console.log("prjs:", projects.length);

                _.each(results, function (r) {
                  var found = _.find(projects, {_id: r.project});
                  if (found) {
                    // console.log("found the project, binding to document object:", found.code);
                    r.project = found;
                  }
                });

                return res.json(results);
              });
          }
        });

    });

  app.route('/api/v2/search')
    .all(policy('guest'))
    .get (function (req, res) {
      routes.setSessionContext(req)
        .then( function (opts) {
        // console.log("req:", JSON.stringify(req.query));
          if (req.query.types === 'document') {
            var docController = new DocumentController(opts);
            var page = 0;
            var limit = 15;
            var count = 0;
            var results = [];
            var projects = null;
            var p = new ProjectController(opts);
            var projectQuery = {};
            // Project Filtering (objectID's are coming in).
            if (req.query.project) {
              projects = req.query.project.split(',');
              projectQuery = _.extend (projectQuery, { "_id": {$in : projects}});
            // console.log("project query:", projectQuery);
            }
            if (req.query.projectcode) {
              var codes = req.query.projectcode.split(',');
              projectQuery = _.extend (projectQuery, { "code": {$in : codes}});
            // console.log("project query:", projectQuery);
            }
            // operator filtering (objectID's are coming in)
            if (req.query.proponent) {
              var ops = req.query.proponent.split(',');
              projectQuery = _.extend (projectQuery, { "proponent": {$in : ops}});
            // console.log("organization query:", projectQuery);
            }
            // owner filtering (objectID's are coming in)
            if (req.query.ownership) {
              var ownershipArray = req.query.ownership.split(',');
              projectQuery = _.extend (projectQuery, { "ownershipData": { $elemMatch: { organization: { $in: ownershipArray }} }});
            // console.log("ownership query:", projectQuery);
            }
            if (req.query.page) {
              page = parseInt(req.query.page, 10);
            }
            if (req.query.limit) {
              limit = parseInt(req.query.limit, 10);
            }
            // We're filtering our searches on project and orgs
            return p.findMany(projectQuery,"_id type name code ownership proponent")
              .then(function (pdata) {
                // console.log("projects:", pdata.length);
                projects = pdata;
                if (projects && projects.length > 0) {
                  // This ensures we don't find docs that are in other projects not part
                  // of the codes lookup if no objectID's are specified.
                  var prjString = "";
                  _.each(projects, function (pp) {
                    prjString += pp._id + ",";
                  });
                  if (prjString) {
                    prjString = prjString.replace(/,*$/, "");
                  }
                  var pjs = prjString || req.query.project;

                  return docController.searchMany(req.query.search,
                    req.query.datestart,
                    req.query.dateend,
                    pjs,
                    null, // not on this one - we already filtered on the org
                    null, // not on this one - we already filtered on the ownership
                    req.query.fields,
                    null, // sort by
                    page,
                    limit,
                    true); // include count

                } else {
                  return { count: 0, results: [] };
                }
              })
              .then(function(data) {
                count = data.count;
                _.each(data.results, function(doc) {
                  results.push(doc);
                });
                // console.log("docs", docs.length);
                return results;
              })
              .then(function () {
                // console.log("prjs:", projects.length);

                _.each(results, function (r) {
                  var found = _.find(projects, {_id: r.project});
                  if (found) {
                    // console.log("found the project, binding to document object:", found.code);
                    r.project = found;
                  }
                });

                return res.json({ count: count, results: results });
              });
          }
        });

    });
};
