import { clickByName, visit } from '@1024pix/ember-testing-library';
import { click, currentURL, fillIn } from '@ember/test-helpers';
import dayjs from 'dayjs';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateAdminMemberWithRole } from 'pix-admin/tests/helpers/test-init';
import { module, test } from 'qunit';

module(
  'Acceptance | Complementary certifications | Complementary certification | attach-target-profile',
  function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    module('when admin member has role "SUPER ADMIN"', function () {
      module('on information section', function () {
        module('where there is an existing target profile', function () {
          test('should display complementary certification and current target profile name', async function (assert) {
            // given
            await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
            server.create('complementary-certification', {
              id: 1,
              key: 'KEY',
              label: 'MARIANNE CERTIF',
              targetProfilesHistory: [{ name: 'ALEX TARGET', id: 3, attachedAt: dayjs('2023-10-10T10:50:00Z') }],
            });
            server.create('target-profile', {
              id: 3,
              name: 'ALEX TARGET',
            });
            const screen = await visit('/complementary-certifications/1/attach-target-profile/3');

            // then
            assert.dom(screen.getByRole('heading', { name: 'MARIANNE CERTIF' })).exists();
            assert.dom(screen.getByRole('link', { name: 'ALEX TARGET' })).exists();
          });

          module('when user click on target profile link', function () {
            test('it should redirect to target profile detail page', async function (assert) {
              // given
              await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
              server.create('complementary-certification', {
                id: 1,
                key: 'KEY',
                label: 'MARIANNE CERTIF',
                targetProfilesHistory: [{ name: 'ALEX TARGET', id: 3, attachedAt: dayjs('2023-10-10T10:50:00Z') }],
              });
              server.create('target-profile', {
                id: 3,
                name: 'ALEX TARGET',
              });
              const screen = await visit('/complementary-certifications/1/attach-target-profile/3');

              const currentTargetProfileLinks = screen.getAllByRole('link', { name: 'ALEX TARGET' });

              // when
              await click(currentTargetProfileLinks[0]);

              // then
              assert.strictEqual(currentURL(), '/target-profiles/3/details');
            });
          });
        });

        module('where there is no existing target profile', function () {
          test('should not display current target profile name', async function (assert) {
            // given
            await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
            server.create('complementary-certification', {
              id: 1,
              key: 'KEY',
              label: 'MARIANNE CERTIF',
              targetProfilesHistory: [],
            });
            const screen = await visit('/complementary-certifications/1/attach-target-profile/-1');

            // then
            assert.dom(screen.getByRole('heading', { name: 'MARIANNE CERTIF' })).exists();
            assert.dom(screen.queryByRole('link', { name: 'ALEX TARGET' })).doesNotExist();
          });
        });

        module('when user selects an attachable target profile', function () {
          test('it should display the link of the selected target profile with a change button', async function (assert) {
            // given
            await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
            server.create('complementary-certification', {
              id: 1,
              key: 'KEY',
              label: 'MARIANNE CERTIF',
              targetProfilesHistory: [{ name: 'ALEX TARGET', id: 3, attachedAt: dayjs('2023-10-10T10:50:00Z') }],
            });
            server.create('attachable-target-profile', {
              id: 3,
              name: 'ALEX TARGET',
            });
            server.create('target-profile', {
              id: 3,
              name: 'ALEX TARGET',
              badges: [],
            });
            const screen = await visit('/complementary-certifications/1/attach-target-profile/3');
            const input = screen.getByRole('textbox', { name: 'ID du profil cible' });
            await fillIn(input, '3');

            await screen.findByRole('listbox');
            const targetProfileSelectable = await screen.findByRole('option', { name: '3 - ALEX TARGET' });

            // when
            await targetProfileSelectable.click();

            // then
            assert.dom(await screen.findByRole('link', { name: 'ALEX TARGET' })).exists();
            assert.dom(await screen.findByRole('button', { name: 'Changer' })).exists();
          });

          test('it should display badges component', async function (assert) {
            // given
            await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
            server.create('complementary-certification', {
              id: 1,
              key: 'KEY',
              label: 'MARIANNE CERTIF',
              targetProfilesHistory: [{ name: 'ALEX TARGET', id: 3, attachedAt: dayjs('2023-10-10T10:50:00Z') }],
            });
            server.create('attachable-target-profile', {
              id: 5,
              name: 'ALEX TARGET',
            });
            const badge = server.create('badge', {
              id: 200,
              title: 'Badge Arène Feu',
              isCertifiable: true,
            });
            server.create('target-profile', {
              id: 5,
              name: 'ALEX TARGET',
              badges: [badge],
            });
            const screen = await visit('/complementary-certifications/1/attach-target-profile/3');
            const input = screen.getByRole('textbox', { name: 'ID du profil cible' });
            await fillIn(input, '5');
            await screen.findByRole('listbox');
            const targetProfileSelectable = await screen.findByRole('option', { name: '5 - ALEX TARGET' });

            // when
            await targetProfileSelectable.click();

            // then
            assert
              .dom(
                await screen.findByRole('heading', { name: '2. Complétez les informations des résultats thématiques' }),
              )
              .exists();
            assert.dom(await screen.findByRole('row', { name: 'Résultat thématique 200 Badge Arène Feu' })).exists();
            assert.dom(await screen.queryByRole('img', { name: 'loader' })).doesNotExist();
          });

          module('where there is an existing target profile', function () {
            test('it should display Notify organisations checkbox', async function (assert) {
              // given
              await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
              server.create('complementary-certification', {
                id: 1,
                key: 'KEY',
                label: 'MARIANNE CERTIF',
                targetProfilesHistory: [{ name: 'ALEX TARGET', id: 3, attachedAt: dayjs('2023-10-10T10:50:00Z') }],
              });
              server.create('attachable-target-profile', {
                id: 5,
                name: 'ALEX TARGET',
              });
              const badge = server.create('badge', {
                id: 200,
                title: 'Badge Arène Feu',
                isCertifiable: true,
              });
              server.create('target-profile', {
                id: 5,
                name: 'ALEX TARGET',
                badges: [badge],
              });
              const screen = await visit('/complementary-certifications/1/attach-target-profile/3');
              const input = screen.getByRole('textbox', { name: 'ID du profil cible' });
              await fillIn(input, '5');
              await screen.findByRole('listbox');
              const targetProfileSelectable = await screen.findByRole('option', { name: '5 - ALEX TARGET' });

              // when
              await targetProfileSelectable.click();

              // then
              //await new Promise((a) => setTimeout(() => a(), 2000));
              assert
                .dom(
                  await screen.findByRole('checkbox', {
                    name: 'Notifier les organisations avec une campagne basée sur l’ancien PC',
                  }),
                )
                .exists();
            });
          });

          module('where there is no existing target profile', function () {
            test('it should not display Notify organisations checkbox', async function (assert) {
              // given
              await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
              server.create('complementary-certification', {
                id: 1,
                key: 'KEY',
                label: 'MARIANNE CERTIF',
                targetProfilesHistory: [],
              });
              server.create('attachable-target-profile', {
                id: 5,
                name: 'ALEX TARGET',
              });
              const badge = server.create('badge', {
                id: 200,
                title: 'Badge Arène Feu',
                isCertifiable: true,
              });
              server.create('target-profile', {
                id: 5,
                name: 'ALEX TARGET',
                badges: [badge],
              });
              const screen = await visit('/complementary-certifications/1/attach-target-profile/3');
              const input = screen.getByRole('textbox', { name: 'ID du profil cible' });
              await fillIn(input, '5');
              await screen.findByRole('listbox');
              const targetProfileSelectable = await screen.findByRole('option', { name: '5 - ALEX TARGET' });

              // when
              await targetProfileSelectable.click();

              // then
              assert
                .dom(
                  screen.queryByRole('checkbox', {
                    name: 'Notifier les organisations avec une campagne basée sur l’ancien PC',
                  }),
                )
                .doesNotExist();
            });
          });
        });

        module('when user submits the form', function () {
          test('it should save the new attached target profile and redirect to complementary certification details', async function (assert) {
            // given
            await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
            server.create('complementary-certification', {
              id: 1,
              key: 'KEY',
              hasExternalJury: true,
              label: 'MARIANNE CERTIF',
              targetProfilesHistory: [{ name: 'ALEX TARGET', id: 3, attachedAt: dayjs('2023-10-10T10:50:00Z') }],
            });
            server.create('attachable-target-profile', {
              id: 5,
              name: 'ALEX TARGET',
            });
            const badge = server.create('badge', {
              id: 200,
              title: 'Badge Arène Feu',
              isCertifiable: true,
            });
            server.create('target-profile', {
              id: 5,
              name: 'ALEX TARGET',
              badges: [badge],
            });
            const screen = await visit('/complementary-certifications/1/attach-target-profile/3');
            const input = screen.getByRole('textbox', { name: 'ID du profil cible' });
            await fillIn(input, '5');
            await screen.findByRole('listbox');
            const targetProfileSelectable = screen.getByRole('option', { name: '5 - ALEX TARGET' });
            await targetProfileSelectable.click();
            await screen.findByRole('row', { name: 'Résultat thématique 200 Badge Arène Feu' });

            await fillIn(screen.getByRole('spinbutton', { name: '200 Badge Arène Feu Niveau' }), '1');
            await fillIn(
              screen.getByRole('textbox', { name: '200 Badge Arène Feu Image svg certificat Pix App' }),
              'IMAGE1.svg',
            );
            await fillIn(screen.getByRole('textbox', { name: '200 Badge Arène Feu Label du certificat' }), 'LABEL');
            await fillIn(
              screen.getByRole('textbox', { name: "200 Badge Arène Feu Macaron de l'attestation PDF" }),
              'MACARON.pdf',
            );
            await fillIn(screen.getByRole('textbox', { name: '200 Badge Arène Feu Message du certificat' }), 'MESSAGE');
            await fillIn(
              screen.getByRole('textbox', { name: '200 Badge Arène Feu Message temporaire certificat' }),
              'TEMP MESSAGE',
            );
            await click(
              screen.getByRole('checkbox', {
                name: 'Notifier les organisations avec une campagne basée sur l’ancien PC',
              }),
            );

            // when
            await clickByName('Rattacher le profil cible');
            // then
            assert
              .dom(
                await screen.findByText(
                  'Profil cible rattaché à la certification MARIANNE CERTIF mis à jour avec succès !',
                ),
              )
              .exists();
            assert.strictEqual(currentURL(), '/complementary-certifications/1/details');
          });
        });

        module('when user does not edit the badge level', function () {
          test('it should save the level to 1 by default', async function (assert) {
            // given
            await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
            server.create('complementary-certification', {
              id: 1,
              key: 'KEY',
              hasExternalJury: true,
              label: 'MARIANNE CERTIF',
              targetProfilesHistory: [{ name: 'ALEX TARGET', id: 3, attachedAt: dayjs('2023-10-10T10:50:00Z') }],
            });
            server.create('attachable-target-profile', {
              id: 5,
              name: 'ALEX TARGET',
            });
            const badge = server.create('badge', {
              id: 200,
              title: 'Badge Arène Feu',
              isCertifiable: true,
            });
            server.create('target-profile', {
              id: 5,
              name: 'ALEX TARGET',
              badges: [badge],
            });
            const screen = await visit('/complementary-certifications/1/attach-target-profile/3');
            const input = screen.getByRole('textbox', { name: 'ID du profil cible' });
            await fillIn(input, '5');
            await screen.findByRole('listbox');
            const targetProfileSelectable = screen.getByRole('option', { name: '5 - ALEX TARGET' });
            await targetProfileSelectable.click();
            await screen.findByRole('row', { name: 'Résultat thématique 200 Badge Arène Feu' });

            const ariaLabel = '200 Badge Arène Feu';
            await fillIn(
              screen.getByRole('textbox', { name: `${ariaLabel} Image svg certificat Pix App` }),
              'IMAGE1.svg',
            );
            await fillIn(screen.getByRole('textbox', { name: `${ariaLabel} Label du certificat` }), 'LABEL');
            await fillIn(
              screen.getByRole('textbox', { name: `${ariaLabel} Macaron de l'attestation PDF` }),
              'MACARON.pdf',
            );
            await fillIn(screen.getByRole('textbox', { name: `${ariaLabel} Message du certificat` }), 'MESSAGE');
            await fillIn(
              screen.getByRole('textbox', { name: `${ariaLabel} Message temporaire certificat` }),
              'TEMP MESSAGE',
            );

            // when
            await clickByName('Rattacher le profil cible');

            // then
            assert.dom(screen.getByRole('row', { name: 'LABEL LABEL 1 200' })).exists();
          });
        });
      });
    });

    module('when admin member has role "CERTIF", "METIER" or "SUPPORT"', function () {
      [
        { role: 'isCertif', hasAccess: false },
        { role: 'isSupport', hasAccess: false },
        { role: 'isMetier', hasAccess: false },
      ].forEach(function ({ role, hasAccess }) {
        test('it should not allow user to access complementary certification and target profile details', async function (assert) {
          // given
          await authenticateAdminMemberWithRole({ [role]: hasAccess })(server);
          server.create('complementary-certification', {
            id: 1,
            key: 'KEY',
            label: 'MARIANNE CERTIF',
            targetProfilesHistory: [{ name: 'ALEX TARGET', id: 3, attachedAt: dayjs('2023-10-10T10:50:00Z') }],
          });
          server.create('target-profile', {
            id: 3,
            name: 'ALEX TARGET',
          });
          await visit('/complementary-certifications/1/attach-target-profile/3');

          // then
          assert.strictEqual(currentURL(), '/complementary-certifications/1/details');
        });
      });
    });
  },
);
