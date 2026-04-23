pipeline {
    agent any

    environment {
        NEXUS_URL = 'http://localhost:8081'
        NEXUS_REPO = 'npm-hosted'
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
                bat 'npm install --legacy-peer-deps'
            }
        }

        stage('Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Configurer Nexus (npmrc)') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-cred',
                                                  usernameVariable: 'NEXUS_USER',
                                                  passwordVariable: 'NEXUS_PASS')]) {
                    bat """
                        if exist .npmrc del .npmrc

                        echo registry=http://localhost:8081/repository/npm-hosted/ > .npmrc
                        echo always-auth=true >> .npmrc
                        echo //localhost:8081/repository/npm-hosted/:username=%NEXUS_USER% >> .npmrc
                        echo //localhost:8081/repository/npm-hosted/:password=%NEXUS_PASS% >> .npmrc
                        echo //localhost:8081/repository/npm-hosted/:email=jenkins@local >> .npmrc
                    """
                }
            }
        }

      stage('Publier vers Nexus') {
    steps {
        bat 'npm publish'
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