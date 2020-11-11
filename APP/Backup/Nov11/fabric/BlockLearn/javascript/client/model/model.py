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

    labelencoder_X1 = LabelEncoder()
    y = labelencoder_X1.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.2, random_state = 0)

    sc = StandardScaler()
    X_train = sc.fit_transform(X_train)
    X_test = sc.transform(X_test)

    model = Sequential()

    model.add(Dense(16, activation='relu', input_dim=30))
    model.add(Dropout(0.1))
    model.add(Dense(16, activation='relu'))
    model.add(Dropout(0.1))
    model.add(Dense(1, activation='sigmoid'))

    model.load_weights("./model/downloadedWeights/"+ BlockId +".h5")

    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    model.fit(X_train, y_train, batch_size=100, epochs=5)

    scores = model.evaluate(X_test, y_test)
    print("Loss: ", scores[0])        #Loss
    print("Accuracy: ", scores[1])    #Accuracy

    #Saving Model
    model.save("./output.h5")

if __name__ == '__main__':
    main()