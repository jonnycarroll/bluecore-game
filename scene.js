class IsoScene {
    constructor(objects = []) {
        this.objects = objects;
    }

    static createDefault(cubeHeight) {
        return new IsoScene([
            {
                type: 'cuboid',
                x: 0,
                y: 0,
                levels: 3,
                height: cubeHeight,
                material: 'blueBlock'
            }
        ]);
    }
}

if (typeof module !== 'undefined') {
    module.exports = IsoScene;
}
