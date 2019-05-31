exports.getPlanningData = (req, res) => {
    let planningData = [
        {
            "title": "test",
            "date": "tomorrow"
        },
        {
            "title": "test it out",
            "date": "today"
        }
    ]
    res.json(planningData)
};