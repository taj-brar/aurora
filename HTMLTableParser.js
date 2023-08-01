"use strict";
const cheerio = require('cheerio');

class HTMLTableParser {
    // INSTANCE VARIABLES
    #htmlToParse;

    // CONSTRUCTOR
    constructor(html) {
        this.#htmlToParse = html;
    }

    // INSTANCE METHODS
    parse() {
        const $ = cheerio.load(this.#htmlToParse);
        const $loadedTable = $("table:first");
        const tableData = $loadedTable["0"].children["2"].children.filter(tag => tag.type === "tag");

        // console.log(tableData);

        let i = 0;
        while (i < tableData.length) {
            // course main info
            console.log(this.getCourseMainInfo(tableData[i++]));

            // course details
            console.log(this.getCourseDetails(tableData[i++]));
        }

        // const $loadedData = $("tr");
        //
        // let i = -1;
        // while (i < $loadedData.length - 1) {
        //     let course = $("tr:eq(" + ++i + ")").text().trim();
        //     let all = $("tr:eq(" + ++i + ")").text().trim();
        //     let columns = $("tr:eq(" + ++i + ")").text().trim();
        //     let data = $("tr:eq(" + ++i + ")").text().trim();
        //
        //     console.log("------------------------------------------COURSE-----------------------------------------------------");
        //     console.log(course);
        //     if (this.isLabDates(course))
        //         console.log("LAB");
        //     console.log(this.getCourseInfo(course));
        //     console.log("---------------------------------------------ALL--------------------------------------------------");
        //     console.log(all);
        //     console.log(this.getCourseMiscellaneous(all));
        //     console.log("----------------------------------------------COLUMNS-------------------------------------------------");
        //     console.log(columns);
        //     console.log("------------------------------------------------DATA-----------------------------------------------");
        //     console.log(data);
        //     console.log(this.getLectureInfo(data));
        //     console.log("-----------------------------------------------------------------------------------------------");
        // }

    }

    getCourseMainInfo(rowElement) {
        let tokens = rowElement.children["1"].children["0"].children["0"].data.split("-").map(token => token.trim());

        return {
            courseName: tokens[0],
            crn: tokens[1],
            courseNumber: tokens[2],
            courseSection: tokens[3]
        };
    }

    getCourseDetails(rowElement) {
        const detailsArray = rowElement.children["1"].children;
        const spanElements = detailsArray.filter(element => element.name === "span");
        const anchorElement = detailsArray.filter(element => element.name === "a");
        const creditsElement = anchorElement["0"].prev.prev.prev;
        const scheduleTypeElement = creditsElement.prev.prev;
        const campusElement = scheduleTypeElement.prev.prev;
        // console.log(rowElement.children["1"].children);

        return {
            requiresLab: detailsArray["0"].type === "text" && detailsArray["0"].data.includes("This section must be taken with a laboratory/tutorial."),
            term: spanElements["0"].next.data.trim(),
            registrationDates: spanElements["1"].next.data.trim(),
            levels: spanElements["2"].next.data.trim(),
            attributes: spanElements.length > 3 ? spanElements["3"].next.data.trim() : null,
            credits: creditsElement.data.trim(),
            scheduleType: scheduleTypeElement.data.trim(),
            campus: campusElement.data.trim(),
        }
    }

    isLabDates(potentialSchedule) {
        return potentialSchedule.includes("computer lab")
    }

    getCourseInfo(courseInfoToParse) {
        let tokens = courseInfoToParse.split("-").map(token => token.trim());

        if (tokens[0].includes("Computer lab"))
            return "COMPUTERLAB";

        return {
            courseName: tokens[0],
            crn: tokens[1],
            courseNumber: tokens[2],
            courseSection: tokens[3]
        };
    }

    getCourseMiscellaneous(courseMiscellaneousToParse) {
        let firstIndex = courseMiscellaneousToParse.indexOf("Associated Term");
        let lastIndex = courseMiscellaneousToParse.indexOf("View Catalog Entry");
        let tokens = courseMiscellaneousToParse.substring(firstIndex, lastIndex).split("\n\n").map(token => token.trim());
        let i = 0;

        return {
            term: this.getValueFromColonString(tokens[i++]),
            registrationDates: this.getValueFromColonString(tokens[i++]),
            levels: this.getValueFromColonString(tokens[i++]),
            attributes: tokens[i].includes("Attributes") ? this.getValueFromColonString(tokens[i++]) : undefined,
            campus: this.getValueFromColonString(tokens[i++]),
            scheduleType: tokens[i++],
            credits: this.getValueFromColonString(tokens[i++])
        };
    }

    getValueFromColonString(value) {
        return value.substring(value.includes(":") ? value.indexOf(": ") + 2 : 0, value.length);
    }

    getLectureInfo(lectureInfoToParse) {
        let tokens = lectureInfoToParse.trim().split("\n").map(token => token.trim());
        return {
            type: tokens[0],
            timeSlot: tokens[1],
            days: tokens[2],
            location: tokens[3],
            dateRange: tokens[4],
            scheduleType: tokens[5],
            instructors: tokens[6]
        };
    }

}// end class HTMLTableParser

module.exports = HTMLTableParser;