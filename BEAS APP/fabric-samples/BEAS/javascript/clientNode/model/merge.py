import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import keras
from keras.models import Sequential
from keras.layers import Dense, Dropout
from sklearn.metrics import confusion_matrix
import sys
from scipy.spatial.distance import euclidean as euc
from os import walk
import tensorflow as tf
import os

maxClusterSize = 100

def getDataLen(trainingDict):
    n = 0
    for w in trainingDict:
#         print(w)
        n += trainingDict[w]
    print('Total number of data points after this round: ', n)
    return n

def assignWeights(trainingDf, trainingDict):
    n = getDataLen(trainingDict)
    trainingDf['Weightage'] = trainingDf['DataSize'].apply(lambda x: x/n)
    return trainingDf, n
    
def scale(weight, scaler):
    scaledWeights = []
    for i in range(len(weight)):
        scaledWeights.append(scaler * weight[i])
    return scaledWeights

def getWeight(d):
    #creating sequential model
    model = Sequential()

    model.add(Dense(16, activation='relu', input_dim=30))
    model.add(Dropout(0.1))
    model.add(Dense(16, activation='relu'))
    model.add(Dropout(0.1))
    model.add(Dense(1, activation='sigmoid'))

    # model.summary()
    
    fpath = "./merge/"+d
    model.load_weights(fpath)
    weight = model.get_weights()
    return weight

def getScaledWeight(d, scaler):
    #creating sequential model
    model = Sequential()

    model.add(Dense(16, activation='relu', input_dim=30))
    model.add(Dropout(0.1))
    model.add(Dense(16, activation='relu'))
    model.add(Dropout(0.1))
    model.add(Dense(1, activation='sigmoid'))

    # model.summary()
    
    fpath = "./merge/"+d
    model.load_weights(fpath)
    weight = model.get_weights()
    return scale(weight, scaler)

def avgWeights(scaledWeights):
    avg = list()
    for weight_list_tuple in zip(*scaledWeights):
        layer_mean = tf.math.reduce_sum(weight_list_tuple, axis=0)
        avg.append(layer_mean)
    return avg

def FedAvg(trainingDict):
    trainingDf = pd.DataFrame.from_dict(trainingDict, orient='index', columns=['DataSize']) 
    models = list(trainingDict.keys())
    scaledWeights = []
    trainingDf, dataLen = assignWeights(trainingDf, trainingDict)
    for m in models:
        scaledWeights.append(getScaledWeight(m, trainingDf.loc[m]['Weightage']))
    fedAvgWeight = avgWeights(scaledWeights)
    return fedAvgWeight, dataLen


def saveModel(weight):
    
    #creating sequential model
    model = Sequential()

    model.add(Dense(16, activation='relu', input_dim=30))
    model.add(Dropout(0.1))
    model.add(Dense(16, activation='relu'))
    model.add(Dropout(0.1))
    model.add(Dense(1, activation='sigmoid'))

    model.set_weights(weight)

    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    
    #Saving Model
    fpath = str("./mergeG/newG.h5")
    model.save(fpath)

def euclidean(m, n):
    distance = []
    for i in range(len(m)):
#         print(i)
        distance.append(euc(m[i].reshape(-1,1), n[i].reshape(-1,1)))
#     print(distance)
    distance = sum(distance)/len(m)
    return distance

def merge(trainingDict, b):
#     print(trainingDict)
    models = list(trainingDict.keys())
#     print(models)
    trainingDf = pd.DataFrame.from_dict(trainingDict, orient='index', columns=['DataSize'])
    l_weights = []
    g_weight = {}
#     print(models)
    for m in range(len(models)):
#         print(m)
        if m == 0:
            g_weight['name'] = models[m]
            g_weight['weight'] = getWeight(models[m])
        else:
            l_weights.append({
                'name': models[m],
                'weight': getWeight(models[m])
            })
#     print(g_weight)
    scores = {}
            
    for m in l_weights:
        scores[m['name']] = euclidean(m['weight'], g_weight['weight'])

    sortedScores = {k: v for k, v in sorted(scores.items(), key=lambda item: item[1])}
    
#     print(scores)
#     print(sortedScores)

    b = int(len(scores)*b)
    
    selected = []
    
    for i in range(b):
        selected.append((sortedScores.popitem())[0])

    newDict = {}
    for i in trainingDict.keys():
        if (i not in selected) and ('global' not in i):
            newDict[i] = trainingDict[i]

    print('Selections: ', newDict)
    
    NewGlobal, dataLen = FedAvg(newDict)
    
    return NewGlobal, dataLen
    

def main():
    # print(os.getcwd())
    filenames = os.listdir('./merge/')
    trainingDict = {}

    for i in filenames:
        trainingDict[i] = maxClusterSize

    m, l = merge(trainingDict, 0.25)

    saveModel(m)

if __name__ == '__main__':
    main()