pipeline {
    agent any

    environment {
        NEXUS_URL = 'http://localhost:8081'
        NEXUS_REPO = 'npm-hosted'
        SONAR_URL = 'http://localhost:9000'
    }

    stages {

        stage('Recuperer le code') {
            steps {
                git branch: 'master',
                    url: 'https://github.com/terangaa/e-commerce-node.js.git'
            }
        }

        stage('Installer les dependances') {
    steps {
        bat 'npm cache clean --force'
        bat 'npm install --legacy-peer-deps'
    }
}

        stage('Lancer les tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Publier vers Nexus') {
            steps {
                bat 'npm publish --registry http://localhost:8081/repository/npm-hosted/'
            }
        }

    }

    post {
        success {
            echo 'Pipeline termine avec succes !'
        }
        failure {
            echo 'Pipeline echoue !'
        }
    }
}