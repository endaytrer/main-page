
export const supportedLicenses = [
    {"name": "None"}, // none means all rights reserved
    {"name": "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0"},
    {"name": "CC BY-NC 4.0", url: "https://creativecommons.org/licenses/by-nc/4.0"},
    {"name": "CC BY-NC-ND 4.0", url: "https://creativecommons.org/licenses/by-nc-nd/4.0"},
    {"name": "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0"},
    {"name": "CC BY-ND 4.0", url: "https://creativecommons.org/licenses/by-nd/4.0"},
    {"name": "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0"},
    {"name": "CC0 1.0", url: "https://creativecommons.org/publicdomain/zero/1.0/"}
]
const ccIcon = `<i class="fa-brands fa-creative-commons"></i>`
const zeroIcon = `<i class="fa-brands fa-creative-commons-zero"></i>`

const termIcons = {
    "BY": `<i class="fa-brands fa-creative-commons-by"></i>`,
    "NC": `<i class="fa-brands fa-creative-commons-nc"></i>`,
    "ND": `<i class="fa-brands fa-creative-commons-nd"></i>`,
    "SA": `<i class="fa-brands fa-creative-commons-sa"></i>`
}
export function getLicense(year, name) {
    if (!name) {
        name = "None"
    }

    const licenseList = supportedLicenses.filter((val) => (val.name === name));
    if (licenseList.length < 1) {
        return `<span class="license">License: ` + name + `</span>`;
    }
    const license = licenseList[0];
    if (license.name === "None") {
        return `<span class="license">&copy; ${year} Zhenrong Gu (danielgu.org). All rights reserved.</span>`
    }
    let ans = ccIcon;
    if (license.name === "CC0 1.0") {
        ans += zeroIcon;
        ans = `<a class="license" href="${license.url}">` + ans + "<span>" + license.name + "</span></a>";
        return ans;
    }
    const terms = license.name.split(" ")[1].split("-");
    for (const term of terms) {
        ans += termIcons[term];
    }
    ans = `<a class="license" href="${license.url}">` + ans + "<span>" + license.name + "</span></a>";
    return ans;
}