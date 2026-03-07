from sklearn.ensemble import RandomForestRegressor

def train_model(X,y):

    model = RandomForestRegressor(n_estimators=100)

    model.fit(X,y)

    return model


def predict_heat(model,data):

    prediction = model.predict(data)

    return prediction