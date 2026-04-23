pipeline {
    agent any

    environment {
        NEXUS_REGISTRY = 'http://localhost:8081/repository/npm-hosted/'
    }

    stages {

        stage('Récupérer code') {
            steps {
                git branch: 'master',
                    url: 'https://github.com/terangaa/e-commerce-node.js.git'
            }
        }

        stage('Install') {
            steps {
                bat 'npm install --legacy-peer-deps'
            }
        }

        stage('Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Configurer Nexus AUTH (FIX FINAL)') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-cred',
                                                  usernameVariable: 'USER',
                                                  passwordVariable: 'PASS')]) {
                    bat """
                        echo registry=%NEXUS_REGISTRY% > .npmrc
                        echo always-auth=true >> .npmrc

                        echo //localhost:8081/repository/npm-hosted/:username=%USER% >> .npmrc
                        echo //localhost:8081/repository/npm-hosted/:_password=%PASS% >> .npmrc
                        echo //localhost:8081/repository/npm-hosted/:email=jenkins@local >> .npmrc

                        npm config set registry %NEXUS_REGISTRY%
                        npm config set always-auth true
                    """
                }
            }
        }

        stage('Vérifier auth (IMPORTANT DEBUG)') {
            steps {
                bat 'npm whoami --registry http://localhost:8081/repository/npm-hosted/ || echo "NON LOGGÉ MAIS CONTINUE"'
            }
        }

        stage('Publish Nexus') {
            steps {
                bat """
                    npm publish --registry http://localhost:8081/repository/npm-hosted/ --verbose
                """
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline OK'
        }
        failure {
            echo '❌ Pipeline échoué - vérifier Nexus permissions'
        }
    }
}