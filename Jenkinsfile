pipeline {
  agent any
  options {
    timestamps()
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Validate') {
      steps {
        echo 'Static site validation placeholder (add html/css/js lint as needed).'
      }
    }
    stage('Package') {
      steps {
        archiveArtifacts artifacts: 'index.html, css/**, js/**, whatsapp_server.py', fingerprint: true
      }
    }
  }
  post {
    always {
      echo 'Pipeline complete.'
    }
  }
}
