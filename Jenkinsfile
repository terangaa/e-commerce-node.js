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
                npm config set registry http://localhost:8081/repository/npm-hosted/
                npm config set always-auth true

                node -e "console.log('registry=http://localhost:8081/repository/npm-hosted/')" > .npmrc

                node -e "console.log('always-auth=true')" >> .npmrc

                node -e "console.log('email=jenkins@local')" >> .npmrc

                node -e "console.log('//' + 'localhost:8081/repository/npm-hosted/:_auth=' + Buffer.from(process.env.NEXUS_USER + ':' + process.env.NEXUS_PASS).toString('base64'))" >> .npmrc
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