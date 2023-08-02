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
            parsedCourses.push({
                ...(this.getCourseMainInfo(tableData[i++])),
                ...(this.getCourseDetails(tableData[i++]))
            });
        }

        return parsedCourses;
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

        return {
            requiresLab: detailsArray["0"].type === "text" && detailsArray["0"].data.includes("This section must be taken with a laboratory/tutorial."),
            term: spanElements["0"].next.data.trim(),
            registrationDates: spanElements["1"].next.data.trim(),
            levels: spanElements["2"].next.data.trim(),
            attributes: spanElements.length > 3 ? spanElements["3"].next.data.trim() : null,
            credits: creditsElement.data.trim(),
            scheduleType: scheduleTypeElement.data.trim(),
            campus: campusElement.data.trim(),
            schedule: this.checkScheduleExists(detailsArray) ? this.getCourseSchedule(detailsArray.filter(element => element.name === "table")["0"]) : null
        }
    }

    checkScheduleExists(detailsArray) {
        const paragraphElements = detailsArray.filter(element => element.name === "p");

        // Plain text indicating instructor approval required
        const instructorApprovalRequired = detailsArray["0"].type === "text" && detailsArray["0"].data.includes("Instructor approval required.");

        // Paragraph indicating section cancelled
        const sectionCancelled = paragraphElements.length !== 0 && paragraphElements["0"].name === "p" && paragraphElements["0"].children["0"].type === "text" && paragraphElements["0"].children["0"].data.includes("Section cancelled");

        // Bold text in paragraph indicating remote course
        const remoteCourse = paragraphElements.length !== 0 && paragraphElements["0"].name === "p" && paragraphElements["0"].children["0"].name === "b" && paragraphElements["0"].children["0"].children["0"].data.includes("Note: This course section will not be delivered on campus. This section will be offered by Remote Learning throughout the Winter Term.");

        return !instructorApprovalRequired && !sectionCancelled && !remoteCourse;
    }

    getCourseSchedule(tableElement) {
        const rowElements = tableElement.children["2"].children.filter(element => element.name === "tr");
        const scheduledDates = new Array(rowElements.length - 1); // parse all row elements except the first since it contains column names

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

}// end class HTMLTableParser

module.exports = HTMLTableParser;