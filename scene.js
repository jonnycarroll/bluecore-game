class IsoScene {
    constructor(objects = []) {
        this.objects = objects;
    }

    static createDefault() {
        return new IsoScene();
    }
}

if (typeof module !== 'undefined') {
    module.exports = IsoScene;
}
