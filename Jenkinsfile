pipeline {
    agent any

    environment {
        NEXUS_URL = 'http://localhost:8081'
        NEXUS_REPO = 'npm-hosted'
        NEXUS_REGISTRY = 'http://localhost:8081/repository/npm-hosted/'
    }

    stages {

        stage('📥 Récupérer le code') {
            steps {
                git branch: 'master',
                    url: 'https://github.com/terangaa/e-commerce-node.js.git'
            }
        }

        stage('📦 Installer dépendances') {
            steps {
                bat '''
                    npm cache clean --force
                    npm install --legacy-peer-deps
                '''
            }
        }

        stage('🧪 Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('🔐 Configurer authentification Nexus (.npmrc)') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-cred',
                                                  usernameVariable: 'NEXUS_USER',
                                                  passwordVariable: 'NEXUS_PASS')]) {
                    bat """
                        echo registry=%NEXUS_REGISTRY% > .npmrc
                        echo always-auth=true >> .npmrc
                        echo email=jenkins@local >> .npmrc

                        echo //localhost:8081/repository/npm-hosted/:username=%NEXUS_USER% >> .npmrc
                        echo //localhost:8081/repository/npm-hosted/:_password=%NEXUS_PASS% >> .npmrc
                        echo //localhost:8081/repository/npm-hosted/:always-auth=true >> .npmrc
                    """
                }
            }
        }

        stage('🚀 Publication vers Nexus') {
            steps {
                bat '''
                    npm whoami --registry http://localhost:8081/repository/npm-hosted/ || echo "Login OK"
                    npm publish --registry http://localhost:8081/repository/npm-hosted/
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline terminé avec succès !'
        }
        failure {
            echo '❌ Pipeline échoué ! Vérifie Nexus / auth / credentials'
        }
    }
}