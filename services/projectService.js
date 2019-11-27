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

const statuses = [
    {
        type: "contractSigned",
        name: "Nog niet actief",
        filter: true
    },
    {
        type: "toContact",
        name: "Te contacteren",
        filter: true
    },
    {
        type: "toPlan",
        name: "Te plannen",
        filter: true
    },
    {
        type: "proposalSent",
        name: "Voorstel doorgegeven",
        filter: true
    },
    {
        type: "planned",
        name: "Ingepland",
        filter: true
    },
    {
        type: "onHold",
        name: "On - Hold",
        filter: true
    },
    {
        type: "onHoldByClient",
        name: "On - Hold door klant",
        filter: true
    },
    {
        type: "executed",
        name: "Uitgevoerd",
        filter: true
    },
    {
        type: "reportAvailable",
        name: "Rapport beschikbaar",
        filter: true
    },
    {
        type: "conformityAvailable",
        name: "Conformiteit beschikbaar",
        filter: true
    },
    {
        type: "completed",
        name: "Afgerond",
        filter: true
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