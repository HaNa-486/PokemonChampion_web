# Active plan

| Slice | Outcome | Risk | Verification | Status |
|---|---|---|---|---|
| Existing-member editing | Restore an exact saved member and replace it in place | Accidental append, reorder, or self-conflict | Component/store regression and team legality suite | Locally verified; Dev UAT pending |
| Searchable move picker | Search names/effects and understand mechanics before selection | Inaccessible results, duplicate moves, mobile clipping | Component accessibility regression plus Dev responsive UAT | Locally verified; Dev UAT pending |
| Release evidence | Exact candidate passes gates and Dev UAT before PR | Candidate drift invalidates UAT | `verify:deploy`, exact commit, `verify:dev`, private Dev deploy | Local gate passed; Dev pending |
