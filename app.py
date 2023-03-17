from flask import *

app = Flask(__name__)

with open('pipeline/adjacencyData.json', 'r') as f:
    adjacencyData = json.load(f)

@app.route('/')
def index():
    return render_template("main-page.html")

@app.route('/editor')
def editor():
    return render_template("editor.html", adjPassData=adjacencyData)

@app.route('/testPage')
def testPage():
    return render_template("testPage.html", adjPassData=adjacencyData)

@app.route('/testPageTwo')
def testPageTwo():
    return render_template("testPageTwo.html", adjPassData=adjacencyData)

@app.route('/fire')
def fire():
    return render_template("fire.html")

if __name__ == "__main__":
    app.run(port=5004)