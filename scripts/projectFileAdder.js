// put this script in the root of the codeversion alongside each directory named in the cartridge path
// update the cartridgePath variable
// run node projectFileAdder.js

var path = require('path')
var fs = require('fs')

// you can copy the a string of the cartridge path from business manager
var cartridgePath = 'int_seo:int_bolt_custom:int_bolt_sfra:int_bolt_extensions:int_bolt_csc:int_bolt_core:int_riskified:int_adyen_SFRA_custom:int_adyen_SFRA:int_adyen_overlay:int_turnto_sfra_v5:int_turnto_core_v5:int_loqate_sfra:int_bloomreach_sfra:int_narvar_sms:plugin_instorepickup:plugin_sitemap:int_globale_custom:int_globale_sfra:int_globale:int_truefit_sfra:int_vertex:int_vertex_sfra:app_accelerator_core:plugin_bolt_giftcertificate:plugin_marketing_cloud:int_dynamicyield_sfra:app_storefront_base:int_paypal:int_dynamicyield:int_marketing_cloud:int_handlerframework:bc_dynamicyield:bc_akeneo_custom:bc_akeneo:int_orderupdate:bc_job_components:int_gtm_core'

var directories = cartridgePath.split(":")

function createProjectFile(name){
    return `<?xml version="1.0" encoding="UTF-8"?>
    <projectDescription>
        <name>${name}</name>
        <comment></comment>
        <projects>
        </projects>
        <buildSpec>
            <buildCommand>
                <name>com.demandware.studio.core.beehiveElementBuilder</name>
                <arguments>
                </arguments>
            </buildCommand>
        </buildSpec>
        <natures>
            <nature>com.demandware.studio.core.beehiveNature</nature>
        </natures>
    </projectDescription>`
}

directories.forEach((directoryName) => {
    var directoryPath = path.join(__dirname, directoryName)
    var projectPath = path.join(directoryPath, '.project')
    console.log(`looking in ${directoryPath} for ${projectPath}`)

    fs.open(projectPath, 'r', function(err, file){
        if (err) {
            var data = createProjectFile(directoryName)
            console.log('does not exist. need to write')
            fs.writeFile(projectPath, data, (err) => {
                if (err) console.error(err)
                console.log('Data written')
            })
        }
        else {
            console.log('.project file already exists!')
        }
    })
})



