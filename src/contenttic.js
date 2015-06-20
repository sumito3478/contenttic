import 'source-map-support/register';
import jade from 'jade';
import remarkable from 'remarkable';
import remarkable_meta from 'remarkable-meta';
import _fs from 'fs';
import prominence from 'prominence';
import glob from 'glob';
import toml from 'toml';
import path from 'path';
import moment from 'moment';
import _mkdirp from 'mkdirp';
import stylus from 'stylus';
import nib from 'nib';
import log4js from 'log4js';
import 'babel/polyfill';

let fs = prominence(_fs);
let mkdirp = async (path) => await prominence({ mkdirp: _mkdirp }).mkdirp(path);
let logger = log4js.getLogger();

let contenttic_root = path.dirname(__dirname);
let resource_string_cache = new Map();
let resource_path = name => `${contenttic_root}/res/${name}`;

let load_resource_as_string = async (name) => {
  let cache = resource_string_cache.get(name);
  if (cache !== void 0)
    return cache;
  let resource = await fs.readFile(resource_path(name), 'utf-8');
  resource_string_cache.set(name, resource);
  return resource;
};

let remarkable_renderer = new remarkable({
  html: true,
  xhtmlOut: true,
  breaks: false,
  langPrefix: '',
  linkify: true,
  typographer: true,
  quotes: '“”‘’', // TODO: i18n
  // TODO: highlight
});
remarkable_renderer.core.ruler.enable([
  'abbr',
]);
remarkable_renderer.block.ruler.enable([
  'footnote',
  'deflist',
]);
remarkable_renderer.inline.ruler.enable([
  'footnote_inline',
  'ins',
  'mark',
  'sub',
  'sup',
]);
remarkable_renderer.use(remarkable_meta);

let md2html = (md) => {
  let html = remarkable_renderer.render(md);
  let meta = remarkable_renderer.meta;
  return [html, meta];
};

let load_jade_resource = name => {
  let cache = void 0;
  return async (locals) => {
    if (cache !== void 0)
      return cache(locals);
    let source = await load_resource_as_string(name);
    cache = jade.compile(source, {
      filename: resource_path(name),
      pretty: ' ',
    });
    return cache(locals);
  };
};

let jade_layout = load_jade_resource('layout.jade');
let jade_feed = load_jade_resource('feed.jade');

let load_stylus_resource = name => {
  let cache = void 0;
  return async () => {
    if (cache !== void 0)
      return cache;
    let source = await load_resource_as_string(name);
    cache = await prominence(stylus(source)
      .set('filename', resource_path(name))
      .use(nib())).render();
    return cache;
  };
};

let style = load_stylus_resource('style.styl');

export let generate = async (options) => {
  options = options === void 0 ? {} : options;
  let src = options.src === void 0 ? '.' : options.src;
  let dst = options.dst === void 0 ? 'static-site' : options.dst;
  let config_source = await fs.readFile(`${src}/config.toml`);
  let config = toml.parse(config_source);
  await mkdirp(dst);
  await mkdirp(`${dst}/tag`);
  await mkdirp(`${dst}/article`);
  let css = await style();
  await fs.writeFile(`${dst}/style.css`, css);
  let x = { glob };
  let mds = await prominence(x).glob(`${src}/**/article/` + '*.md');
  mds.push(`${src}/about.md`);
  mds = mds.map(p => path.relative(src, p));
  let contents = [];
  let to_content = async (md) => {
    let mdText = await fs.readFile(`${src}/${md}`, 'utf-8');
    let id = md.slice(0, -3)
    let out = id + '.html';
    let [mdHtml, meta] = md2html(mdText);
    let content = {
      body: mdHtml,
      metaData: meta,
      tags: meta.tags,
      title: meta.title,
      permalink: out,
      createdAt: meta.createdAt ? moment(meta.createdAt).format('YYYY-MM-DD') : '?',
      updatedAt: meta.date ? moment(meta.date).format('YYYY-MM-DD') : '?',
      id,
    };
    return content;
  };
  for (let md of mds) {
    contents.push(await to_content(md));
  }
  contents.sort((a, b) =>
    moment(b.updatedAt, 'YYYY-MM-DD').unix() - moment(a.updatedAt, 'YYYY-MM-DD').unix()
  );
  let today = moment().format('YYYY-MM-DD');
  let index = {
    body: (md2html(contents.map(content => `- [${content.title}](/${content.permalink})`).join('\n'))[0]),
    author: config.author,
    metaData: {
      title: 'INDEX',
      createdAt: today,
      updatedAt: today,
      date: today,
      tags: [],
    },
    tags: [],
    title: '記事一覧',
    permalink: 'index.html',
    id: 'index',
    createdAt: today,
    updatedAt: today,
  };
  contents.unshift(index);
  let allTags = new Set();
  for (let content of contents) {
    let meta = content.metaData;
    for (let tag of meta.tags)
      allTags.add(tag);
  }
  let save = async (permalink, data) => await fs.writeFile(`${dst}/${permalink}`, data);
  let compile_content = async (content) => {
    let meta = content.metaData;
    let html = await jade_layout({
      author: meta.author,
      website: config.title,
      rights: config.rights,
      title: meta.title,
      contents: [ content ],
      allTags: [...allTags],
      lang: meta.lang,
      css: 'style.css',
      updatedAt: meta.date,
      root: path.relative(path.dirname(content.permalink), '.'),
      highlighted: [ 'javascript', 'scala' ],
      path: content.permalink,
      id: content.id,
    });
    await save(content.permalink, html);
  };
  let tagMap = new Map();
  for (let content of contents) {
    await compile_content(content);
    for (let tag of content.tags) {
      let xs = tagMap.get(tag);
      if (!xs) {
        xs = [];
        tagMap.set(tag, xs);
      }
      xs.push(content);
    }
  }
  for (let [tag, contents] of tagMap) {
    let id = `tag/${tag}`;
    let permalink = `${id}.html`;
    let authors = new Set();
    for (let content of contents) {
      authors.add(content.metaData.author);
    }
    let html = await jade_layout({
      author: [...authors].join(', '),
      website: config.title,
      rights: config.rights,
      title: 'タグ ' + tag,
      contents: contents,
      allTags: [...allTags],
      lang: 'ja',
      css: 'style.css',
      updatedAt: contents[0].metaData.updatedAt,
      root: path.relative(path.dirname(permalink), '.'),
      highlighted: [ 'javascript', 'scala' ],
      path: permalink,
      id,
    });
    await save(permalink, html);
  }
  let authors = new Set();
  for (let content of contents) {
    authors.add(content.metaData.author);
  }
  let allId = 'article/all';
  let allPermalink = `${allId}.html`;
  let allHtml = await jade_layout({
    author: [...authors].join(', '),
    website: config.title,
    rights: config.rights,
    title: '全ての記事',
    contents: contents,
    allTags: [...allTags],
    lang: 'ja',
    css: 'style.css',
    updatedAt: contents[0].metaData.updatedAt,
    root: path.relative(path.dirname(allPermalink), '.'),
    highlighted: [ 'javascript', 'scala', 'rust' ],
    path: allPermalink,
    id: allId,
  });
  await save(allPermalink, allHtml);
  let feedId = 'feed';
  let feedPermalink = `${feedId}.xml`;
  let feedHtml = await jade_feed({
    author: [...authors].join(', '),
    title: config.title,
    rights: config.rights,
    contents: contents,
    allTags: [...allTags],
    lang: 'ja',
    css: 'style.css',
    updatedAt: contents[0].metaData.updatedAt,
    root: path.relative(path.dirname(feedPermalink), '.'),
    highlighted: [ 'javascript', 'scala', 'rust' ],
    path: feedPermalink,
    id: feedId,
  });
  await save(feedPermalink, feedHtml);
  return true;
};

export function test() {
  generate({ src: 'test-res/sample', dst: 'tmp/test-sample' }).catch(reason => logger.error(reason.stack));
}

// vim:set ts=2 sw=2 et:
