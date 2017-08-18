node {
  // Edit your app's name below
  def APP_NAME = 'mem-mmt'

  // Edit your environment TAG names below
  def TAG_NAMES = ['dev', 'test', 'prod']

  // You shouldn't have to edit these if you're following the conventions
  def BUILD_CONFIG = APP_NAME
  def IMAGESTREAM_NAME = APP_NAME

  properties([[$class: 'BuildConfigProjectProperty', name: '', namespace: '', resourceVersion: '', uid: ''], pipelineTriggers([githubPush()])])

  stage('build ' + BUILD_CONFIG) {
    echo "Building: " + BUILD_CONFIG
    openshiftBuild bldCfg: BUILD_CONFIG, showBuildLogs: 'true'
    openshiftTag destStream: IMAGESTREAM_NAME, verbose: 'true', destTag: '$BUILD_ID', srcStream: IMAGESTREAM_NAME, srcTag: 'latest'
  }
  stage('deploy-' + TAG_NAMES[0]) {
    openshiftTag destStream: IMAGESTREAM_NAME, verbose: 'true', destTag: TAG_NAMES[0], srcStream: IMAGESTREAM_NAME, srcTag: '$BUILD_ID'
  }
//  stage('deploy-' + TAG_NAMES[1]) {
//    input "Deploy to " + TAG_NAMES[1] + "?"
//    openshiftTag destStream: IMAGESTREAM_NAME, verbose: 'true', destTag: TAG_NAMES[1], srcStream: IMAGESTREAM_NAME, srcTag: '$BUILD_ID'
//  }
//  stage('deploy-'  + TAG_NAMES[2]) {
//    input "Deploy to " + TAG_NAMES[2] + "?"
//    openshiftTag destStream: IMAGESTREAM_NAME, verbose: 'true', destTag: TAG_NAMES[2], srcStream: IMAGESTREAM_NAME, srcTag: '$BUILD_ID'
//  }
}
