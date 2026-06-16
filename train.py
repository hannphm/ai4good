from train_regressor import main as train_regressor
from train_classifier import main as train_classifier


def main():
    print("=" * 60)
    print("Training Pain Regressor")
    print("=" * 60)

    train_regressor()

    print("\n")
    print("=" * 60)
    print("Training Flare-up Classifier")
    print("=" * 60)

    train_classifier()

    print("\n")
    print("=" * 60)
    print("Training Complete")
    print("=" * 60)


if __name__ == "__main__":
    main()