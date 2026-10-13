import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt

import numpy as np


def scale_features(features):
    """Standardize feature columns without relying on compiled sklearn modules."""
    values = features.to_numpy(dtype=float)
    means = values.mean(axis=0)
    scales = values.std(axis=0)
    scales[scales == 0] = 1
    return (values - means) / scales


def kmeans_labels(values, n_clusters, random_state=42, max_iter=100):
    """Return deterministic K-means labels using NumPy operations."""
    rng = np.random.default_rng(random_state)
    centers = values[rng.choice(len(values), size=n_clusters, replace=False)].copy()

    for _ in range(max_iter):
        distances = ((values[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
        labels = distances.argmin(axis=1)
        updated = centers.copy()

        for cluster_id in range(n_clusters):
            members = values[labels == cluster_id]
            if len(members):
                updated[cluster_id] = members.mean(axis=0)
            else:
                updated[cluster_id] = values[rng.integers(len(values))]

        if np.allclose(updated, centers):
            break
        centers = updated

    distances = ((values[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
    return distances.argmin(axis=1)


# Page configuration
st.set_page_config(
    page_title="Customer Segmentation",
    page_icon="📊",
    layout="wide"
)


# Title
st.title("📊 Customer Segmentation Using K-Means")
st.write("Data Warehousing and Data Mining Project")


# Load dataset
df = pd.read_csv("customers.csv")


# Sidebar
st.sidebar.title("Customer Segmentation")

menu = st.sidebar.radio(
    "Select Option",
    [
        "Dashboard",
        "Data Preprocessing",
        "Customer Segmentation",
        "Visualization",
        "Customer Analysis"
    ]
)


# --------------------------------------------------
# Dashboard
# --------------------------------------------------

if menu == "Dashboard":

    st.header("Dashboard")

    col1, col2, col3 = st.columns(3)

    col1.metric("Total Customers", len(df))
    col2.metric("Average Age", round(df["Age"].mean(), 2))
    col3.metric("Average Income", round(df["AnnualIncome"].mean(), 2))

    st.subheader("Customer Dataset")

    st.dataframe(df, use_container_width=True)


# --------------------------------------------------
# Data Preprocessing
# --------------------------------------------------

elif menu == "Data Preprocessing":

    st.header("Data Preprocessing")

    st.subheader("Original Data")

    st.dataframe(df)

    st.write("Missing Values:")

    st.write(df.isnull().sum())

    st.write("Duplicate Records:")

    st.write(df.duplicated().sum())

    # Remove duplicates
    df = df.drop_duplicates()

    st.success("Data preprocessing completed.")


# --------------------------------------------------
# Customer Segmentation
# --------------------------------------------------

elif menu == "Customer Segmentation":

    st.header("Customer Segmentation")

    features = df[
        ["Age", "AnnualIncome", "SpendingScore"]
    ]

    scaled_data = scale_features(features)

    # Select number of clusters
    k = st.slider(
        "Select Number of Clusters",
        min_value=2,
        max_value=6,
        value=3
    )

    df["Cluster"] = kmeans_labels(scaled_data, k)

    st.subheader("Clustered Customers")

    st.dataframe(df, use_container_width=True)

    st.success(
        f"Customers successfully divided into {k} clusters."
    )


# --------------------------------------------------
# Visualization
# --------------------------------------------------

elif menu == "Visualization":

    st.header("Customer Segmentation Visualization")

    features = df[
        ["Age", "AnnualIncome", "SpendingScore"]
    ]

    scaled_data = scale_features(features)
    df["Cluster"] = kmeans_labels(scaled_data, 3)

    fig, ax = plt.subplots()

    ax.scatter(
        df["AnnualIncome"],
        df["SpendingScore"],
        c=df["Cluster"]
    )

    ax.set_xlabel("Annual Income")
    ax.set_ylabel("Spending Score")
    ax.set_title("Customer Segmentation")

    st.pyplot(fig)


# --------------------------------------------------
# Customer Analysis
# --------------------------------------------------

elif menu == "Customer Analysis":

    st.header("Customer Analysis")

    features = df[
        ["Age", "AnnualIncome", "SpendingScore"]
    ]

    scaled_data = scale_features(features)
    df["Cluster"] = kmeans_labels(scaled_data, 3)

    selected_id = st.selectbox(
        "Select Customer",
        df["CustomerID"]
    )

    customer = df[
        df["CustomerID"] == selected_id
    ]

    st.subheader("Customer Details")

    st.dataframe(customer)

    cluster = customer["Cluster"].iloc[0]

    st.write(
        f"This customer belongs to **Cluster {cluster}**."
    )
