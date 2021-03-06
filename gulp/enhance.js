import _ from "lodash";
import path from "path";
import minimatch from "minimatch";

let repos = require("../repos.json");

// The enhance middleware populates a bunch of metadata fields on the files.
export default function enhance(files, metalsmith, done) {
  _.each(files, (f, p) => {
    addSrcInfo(f, p, metalsmith);
    addRepoInfo(f, p, metalsmith);
    addProject(f, p, metalsmith);
    addFullTitle(f, p, metalsmith);
    addSection(f, p, metalsmith);
    addLayout(f, p, metalsmith);
    addDefaultTitles(f, p, metalsmith);
    addExamples(f, p, metalsmith);
  })
  done();
}

function addSrcInfo(f, p) {
  f.srcPath = p;
}

function addRepoInfo(f, p) {
  let parts = p.split(path.sep);

  switch(parts[0]) {
    case "learn":
    case "reference":
    case "tools":
    case "beyond-code":
      f.repo = "docs";
      f.repoPath = p;
      break;
    default:
      // if parts[0] is the name of a repo, use it
      if (parts[0] in repos) {
        f.repo = parts[0];
        let newParts = parts.slice(0);
        newParts[0] = "docs";
        f.repoPath = newParts.join("/");
      } else {
        // no repo for this case
      }
    break;
  }

  if (!f.repo) return;

  let repo = repos[f.repo];
  f.repoURL = repo.githubURL;
  f.repoBlobURL = repo.githubURL + "/blob/master/" + f.repoPath;
}

function addProject(f, p) {
  if (!f.repo) return;
  if (f.repo === "docs") return;

  f.project = f.repo;
  f.projectTitle = repos[f.repo].projectTitle;
}

function addFullTitle(f, p) {
  let titleSuffix = ' | Stellar Developers';

  if (!f.projectTitle || f.repo === 'docs') {
    f.fullTitle = f.title + titleSuffix;
    return;
  };

  f.fullTitle = f.title + ' - ' + f.projectTitle + titleSuffix;
}

function addSection(f, p) {
  if (path.extname(p) !== ".md") return;

  let parts = p.split(path.sep);
  switch(parts[0]) {
    case "learn":
    case "reference":
    case "tools":
    case "beyond-code":
      f.section = parts[0];
      break;
    default:
      // if we're dealing with a document inside a project's /docs folder, don't assign a layout
      if (parts.length == 2) {
        return;
      }
      // if not one of the above cases, then we are dealing with a project-specific
      // file (i.e. horizon, js-stellar-sdk).  In this case, we determine layout
      // based upon the nesting undernearth the project name.
      f.section = parts[1];
      break;
  }
}

function addLayout(f, p) {
  if ("section" in f) {
    f.layout = f.section + ".handlebars";
  }
}

function addDefaultTitles(f, p) {
  if (minimatch(p, "**/!(*.md)")) return;
  if ("title" in f) return;

  console.log(`warn: ${p} has no title`);
  f.title = path.basename(p);
}

function addExamples(f, p, metalsmith) {
  if(!minimatch(p, "horizon/reference/*.*")) return;
  let examples = metalsmith.metadata()._examples;
  let ext = path.extname(p);
  let endpoint = path.basename(p).slice(0,-ext.length);

  if(!(endpoint in examples)) return;

  f.examples = examples[endpoint];
}
