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

def main():
    print(sys.argv)
    BlockId = sys.argv[1]
    data = pd.read_csv('./model/upload/data.csv')
    # data = pd.read_csv('./test_data/data.csv')
    del data['Unnamed: 32']
    # data = data[:50]

    X = data.iloc[:, 2:].values
    y = data.iloc[:, 1].values

    labelencoder = LabelEncoder()
    Y = labelencoder.fit_transform(y)

    sc = StandardScaler()
    X = sc.fit_transform(X)

    model = Sequential()

    model.add(Dense(16, activation='relu', input_dim=30))
    model.add(Dropout(0.1))
    model.add(Dense(16, activation='relu'))
    model.add(Dropout(0.1))
    model.add(Dense(1, activation='sigmoid'))

    model.load_weights("./model/downloadedWeights/"+ BlockId +".h5")

    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    model.fit(X, Y, batch_size=10, epochs=3)

    #Saving Model
    model.save("./output.h5")

if __name__ == '__main__':
    main()