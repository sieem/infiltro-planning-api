const projectTypes = [
    {
        type: "house",
        name: "Woning"
    },
    {
        type: "stairs",
        name: "Traphal"
    },
    {
        type: "apartment",
        name: "Appartement"
    },
    {
        type: "mixed",
        name: "Gemengd"
    },
    {
        type: "other",
        name: "Andere"
    }
]

const executors = [
    {
        type: "roel",
        name: "Roel"
    },
    {
        type: "david",
        name: "David"
    },
    {
        type: "together",
        name: "Samen"
    }
]

exports.executorName = (type) => {
    let name;
    executors.forEach(executor => {
        if (executor.type === type) {
            name = executor.name
        }
    })
    return name || 'Onbeslist'

}

exports.projectTypeName = (type) => {
    let name;
    projectTypes.forEach(projectType => {
        if (projectType.type === type) {
            name = projectType.name
        }
    })
    return name || 'Onbekend'
}