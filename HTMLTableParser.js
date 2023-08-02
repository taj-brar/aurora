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
        let parsedCourses = [];

        let i = 0;
        while (i < tableData.length) {
            console.log(this.getCourseMainInfo(tableData[i++]));
            console.log(this.getCourseDetails(tableData[i++]));

            // parsedCourses.push({
            //     ...(this.getCourseMainInfo(tableData[i++])),
            //     ...(this.getCourseDetails(tableData[i++]))
            // });
        }

        return parsedCourses;

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
        const paragraphElements = detailsArray.filter(element => element.name === "p");
        const creditsElement = anchorElement["0"].prev.prev.prev;
        const scheduleTypeElement = creditsElement.prev.prev;
        const campusElement = scheduleTypeElement.prev.prev;
        const noScheduleExists = (detailsArray["0"].type === "text" && detailsArray["0"].data.includes("Instructor approval required."))
            || (paragraphElements.length !== 0 && paragraphElements["0"].name === "p" && paragraphElements["0"].children["0"].type === "text" && paragraphElements["0"].children["0"].data.includes("Section cancelled")
            || (paragraphElements.length !== 0 && paragraphElements["0"].name === "p" && paragraphElements["0"].children["0"].name === "b" && paragraphElements["0"].children["0"].children["0"].data.includes("Note: This course section will not be delivered on campus. This section will be offered by Remote Learning throughout the Winter Term.")));

        return {
            requiresLab: detailsArray["0"].type === "text" && detailsArray["0"].data.includes("This section must be taken with a laboratory/tutorial."),
            term: spanElements["0"].next.data.trim(),
            registrationDates: spanElements["1"].next.data.trim(),
            levels: spanElements["2"].next.data.trim(),
            attributes: spanElements.length > 3 ? spanElements["3"].next.data.trim() : null,
            credits: creditsElement.data.trim(),
            scheduleType: scheduleTypeElement.data.trim(),
            campus: campusElement.data.trim(),
            schedule: noScheduleExists ? null : this.getCourseSchedule(detailsArray.filter(element => element.name === "table")["0"])
        }
    }

    getCourseSchedule(tableElement) {
        const rowElements = tableElement.children["2"].children.filter(element => element.name === "tr");
        const scheduledDates = new Array(rowElements.length - 1);

        for (let i = 1; i < rowElements.length; i++)
            scheduledDates.push(this.getParsedScheduledDate(rowElements[i]));

        return scheduledDates;
    }

    getParsedScheduledDate(rowElement) {
        const dataElements = rowElement.children.filter(element => element.name === "td");

        return {
            type: this.getFirstChildData(dataElements[0]),
            timeSlot: this.getFirstChildData(dataElements[1]),
            days: this.getFirstChildData(dataElements[2]),
            location: this.getFirstChildData(dataElements[3]),
            dateRange: this.getFirstChildData(dataElements[4]),
            scheduleType: this.getFirstChildData(dataElements[5]),
            instructors: this.getFirstChildData(dataElements[6])
        }
    }

    getFirstChildData(element) {
        return element.children["0"].data;
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