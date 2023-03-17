from flask import *

app = Flask(__name__)

with open('pipeline/adjacencyData.json', 'r') as f:
    adjacencyData = json.load(f)

@app.route('/editor')
def editor():
    return render_template("editor.html", adjPassData=adjacencyData)

@app.route('/testPage')
def testPage():
    return render_template("testPage.html", adjPassData=adjacencyData)

if __name__ == "__main__":
    app.run(port=5004)