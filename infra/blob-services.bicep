@description('The name of the storage account to add the blob service to.')
param storageAccountName string

param blobServiceName string = 'default'

param containerNames array

resource st 'Microsoft.Storage/storageAccounts@2022-05-01' existing = {
  name: storageAccountName
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2022-05-01' = {
  name: blobServiceName
  parent: st
  properties: {
    cors: {
      corsRules: [
        {
          allowedHeaders: [
            '*'
          ]
          allowedMethods: [
            'GET'
          ]
          allowedOrigins: [
            '*'
          ]
          exposedHeaders: [
            '*'
          ]
          maxAgeInSeconds: 60
        }
      ]
    }
  }
}

resource blobContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-05-01' = [for name in containerNames: {
  name: '${name}'
  parent: blobServices
  properties: {
    publicAccess: 'None'
  }
}]
