@echo off
cd ml_service
echo Starting Jupyter Notebook with no token...
jupyter notebook --NotebookApp.token='' --NotebookApp.password='' --no-browser --port=8888
