const { series,src,dest} = require('gulp');
const concatCss = require('gulp-concat-css');
const replace = require('gulp-replace');
const inject = require('gulp-inject-string');
const print = require('gulp-print').default;
const contains = require('gulp-contains');
const clean = require('gulp-clean');
const fs = require('fs')

//需要更改的主题名放入数组，最少一个，建议不超过10个
const  folders = ['activehound','adventure'];

function product(cb){
    const tasks = folders.map((element)=> {
        fs.readFile(`template/${element}/templates/product.liquid`, "utf8", function(err, data) {
            if (data.includes('<div class="productshow_html" itemtype="http://schema.org/Product" itemscope>')){
                return src(`template/${element}/**/product.liquid`)
                    .pipe(inject.after('<div class="productshow_html" itemtype="http://schema.org/Product" itemscope>', '\n \t<meta itemprop="brand" content="{% if product.brand %}{{product.brand}}{% else %}{{shop.name}}{% endif %}">\n' +
                        '    <meta itemprop="mpn" content="{{ product.id }}">\n' +
                        '    <meta itemprop="sku" content="{{ product.id }}">\n'+
                        '    <meta itemprop="image" content="{{ product.featuredimage.src }}">'
                    ))
                    .pipe(inject.after('<meta itemprop="reviewCount" content="{{ product.reviewcount }}">', '\n \t\t\t\t{% else %}\n' +
                        '                    <meta itemprop="ratingValue" content="5.0">\n' +
                        '                    <meta itemprop="reviewCount" content="5">'))
                    .pipe(inject.replace('{% if product.reviewcount > 0 %} itemprop="aggregateRating" itemscope itemtype="http://schema.org/AggregateRating" {% endif %}', 'itemprop="aggregateRating" itemscope itemtype="http://schema.org/AggregateRating"'))
                    .pipe(replace('<span itemprop="reviewCount" class="sums">',' <span {%if product.reviewcount > 0%} itemprop="reviewCount"{% endif %} class="sums">'))
                    .pipe(replace('<a>( {{ product.reviewcount }} )</a>', '<a> {{ product.reviewcount }} </a>'))
                    .pipe(inject.before('<meta itemprop="priceCurrency" content="USD">', '\n\t\t\t\t\t\t<meta itemprop="url" content="{{ canonical_url }}">\n' +
                        '                        <meta itemprop="priceValidUntil" content="2099-12-12">\n\t\t\t\t\t\t'))
                    .pipe(print())
                    .pipe(dest(`out/${element}`,{overwrite:true}));
            }else if (data.includes('<div class="productshow_html" itemtype="http://schema.org/Product" itemscope>') ===false){
                console.log(element,"错误请检查  itemscope> ",data.includes('<div class="productshow_html" itemtype="http://schema.org/Product" itemscope>'))
            }else {
                console.log(element,'other wrong')
            }
        });

    })
    cb()
}

function productReviews(cb){
    folders.map((element) => {
        return src(`template/${element}/**/product-reviews.liquid`)
            .pipe(replace('{% if product.reviewcount == 0 %}',' '))
            .pipe(inject.after('id="products_reviews"', '\titemprop="review" itemscope itemtype="http://schema.org/Review"\t'))
            .pipe(inject.after('>',   '\n    {% if product.reviewcount == 0 %}\n' +
                '    <meta itemprop="author" content="xxxxxx">\n' +
                '    {% endif %}'))
            .pipe(inject.after('{{ language.product_reviews_by }}<strong', '\titemprop="author"'))
            .pipe(inject.before('>{{ review.date | date: "invariantinfo" }}</cite>', ' itemprop="datePublished" '))
            .pipe(inject.before('>{{ review.text }}</div>', ' itemprop="reviewBody"'))
            .pipe(contains('<cite itemprop="datePublished" '))
            .pipe(print())
            .pipe(dest(`out/${element}`,{overwrite:true}));
    })
    cb()
}

//复制 到对应主题
//templates/product
//snippets/product-reviews
//snippets  productshow_list.liquid

function copyProducte(cb){
    const tasks = folders.map((element)=> {
        return src(`out/${element}/**/product.liquid`)
            .pipe(print())
            .pipe(dest(`./template/${element}`),{overwrite:true})
            .pipe(print())
    })
    cb()
}

function copyReviews(cb){
    const tasks = folders.map((element)=> {
        return src([`out/${element}/**/product-reviews.liquid`])
            .pipe(print())
            .pipe(dest(`./template/${element}`),{overwrite:true})
            .pipe(print())
    })
    cb()
}

//合并 css
function mergeCss(){
    folders.map((element) => {
        return src(
            [
                `template/${element}/assets/**/css.css`,
                `template/${element}/assets/**/index.css`,
                `template/${element}/assets/**/cart.css`,
                `template/${element}/assets/**/webfont.css`,
                'template/**/lazyloaded.css'])
            .pipe(concatCss("/assets/css.css"))
            .pipe(print())
            .pipe(dest(`out/${element}`));
    })
}

//删除不需要的css
function deleteCss(){
    folders.map((element) => {
        return src(
            [
                `template/${element}/assets/**/css.css`,
                `template/${element}/assets/**/index.css`,
                `template/${element}/assets/**/cart.css`,
                `template/${element}/assets/**/webfont.css`
            ]
        )
            .pipe(print())
            .pipe(clean())

    })
}

//复制合并的css 到对应的主题文件夹
function copyCssToTemplate(){
    const tasks = folders.map((element)=> {
        return src(`out/${element}/assets/css.css`)
            .pipe(print())
            .pipe(dest(`template/${element}/assets/css`),{overwrite:true})
    })
}




//任务
exports.product = product;
exports.productReviews = productReviews
exports.mergeCss = mergeCss
exports.copyCssToTemplate= copyCssToTemplate
exports.deleteCss = deleteCss
exports.copyProducte =copyProducte
exports.copyRe= copyReviews

//执行任务（添加需要的 属性 或  class）
exports.default = series(product,productReviews);

//执行任务（合并css 导出目录为 /out/主题名称）
exports.cssmg = series(mergeCss);

//删除css（css.css、index.css、cart.css、webfont.css）
exports.delecss = series(deleteCss)

//合并css、复制的对应的主题
exports.cpcss = series(copyCssToTemplate)


//复制文件(product、product-reviews)、的对应文件到主题
exports.cproduct = series(copyProducte,copyReviews)
