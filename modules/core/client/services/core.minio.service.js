'use strict';

angular.module('core').factory('MinioService', ['ModelBase', '$http', function (ModelBase, $http) {
  var MinioService = ModelBase.extend({
    /**
     * Upload a file using a minio presigned PUT url.
     * @param minioPresignedURL a minio presigned put url
     * @param file a file object
     * @param progressCallback a callback function that will be called periodically with an http progress event.
     */
    putMinioDocument: function (minioPresignedURL, file, progressCallback) {
      return $http({
        method: 'PUT',
        url: minioPresignedURL,
        data: file,
        headers: {
          "Content-Type": file.mimetype
        },
        uploadEventHandlers: {
          progress: progressCallback
        }
      });
    },
    /**
     * Delete a file from minio.
     * @param projectCode a project code
     * @param fileName the name of the file
     */
    deleteMinioDocument: function (projectCode, fileName) {
      return this.delete('/api/deleteMinioDocument/' + projectCode + '/' + fileName);
    }
  })
  return new MinioService();
}]);
