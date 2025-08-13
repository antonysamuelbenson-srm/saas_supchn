import math

def mape(actual, forecast):
    """Mean Absolute Percentage Error"""
    actual, forecast = list(actual), list(forecast)
    n = len(actual)
    errors = []
    for a, f in zip(actual, forecast):
        if a != 0:  # avoid division by zero
            errors.append(abs((a - f) / a))
    return (sum(errors) / len(errors)) * 100 if errors else None

def smape(actual, forecast):
    """Symmetric Mean Absolute Percentage Error"""
    actual, forecast = list(actual), list(forecast)
    errors = []
    for a, f in zip(actual, forecast):
        denom = (abs(a) + abs(f)) / 2
        if denom != 0:
            errors.append(abs(a - f) / denom)
    return (sum(errors) / len(errors)) * 100 if errors else None

def mae(actual, forecast):
    """Mean Absolute Error"""
    actual, forecast = list(actual), list(forecast)
    errors = [abs(a - f) for a, f in zip(actual, forecast)]
    return sum(errors) / len(errors) if errors else None

def rmse(actual, forecast):
    """Root Mean Squared Error"""
    actual, forecast = list(actual), list(forecast)
    errors = [(a - f) ** 2 for a, f in zip(actual, forecast)]
    return math.sqrt(sum(errors) / len(errors)) if errors else None
